const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AdminRequest = require('../models/AdminRequest');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify admin token
const verifyAdminToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const admin = await Admin.findById(decoded.id);

        if (!admin || admin.status !== 'active') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to verify super-admin privilege
const verifySuperAdmin = (req, res, next) => {
    if (req.admin.role !== 'super-admin') {
        return res.status(403).json({ message: 'Only super-admins can perform this action' });
    }
    next();
};

// ================== REQUEST ENDPOINTS ==================

/**
 * @route   POST /admin-management/request
 * @desc    Submit a new admin access request
 * @access  Public
 */
router.post('/request', async (req, res) => {
    try {
        const { name, email, password, adminCode, reason, department, role } = req.body;

        // Validation
        if (!name || !email || !password || !adminCode) {
            return res.status(400).json({
                message: 'Name, email, password, and admin code are required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if email already requested or exists in Admin
        const existingRequest = await AdminRequest.findOne({ email });
        if (existingRequest && existingRequest.status === 'pending') {
            return res.status(400).json({ message: 'Request for this email already pending approval' });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin with this email already exists' });
        }

        // Create admin request
        const adminRequest = await AdminRequest.create({
            name,
            email,
            password,
            adminCode,
            reason,
            department,
            role: role || 'admin',
            status: 'pending'
        });

        // Notify super-admins about new request
        const superAdmins = await Admin.find({ role: 'super-admin', status: 'active' });
        for (const superAdmin of superAdmins) {
            try {
                await sendEmail(
                    superAdmin.email,
                    'New Admin Access Request',
                    `
                    <h2>New Admin Access Request</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Department:</strong> ${department || 'Not specified'}</p>
                    <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
                    <p><strong>Requested Role:</strong> ${role || 'admin'}</p>
                    <p>Please login to the dashboard to review and approve/reject this request.</p>
                    `
                );
            } catch (emailError) {
                console.error('Failed to send notification email:', emailError);
            }
        }

        res.status(201).json({
            message: 'Admin access request submitted successfully. Awaiting super-admin approval.',
            request: {
                id: adminRequest._id,
                email: adminRequest.email,
                status: adminRequest.status,
                requestedAt: adminRequest.requestedAt
            }
        });
    } catch (error) {
        console.error('Admin request error:', error);

        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        res.status(500).json({ message: 'Error submitting request', error: error.message });
    }
});

/**
 * @route   GET /admin-management/requests/pending
 * @desc    Get all pending admin requests (super-admin only)
 * @access  Private (super-admin)
 */
router.get('/requests/pending', verifyAdminToken, verifySuperAdmin, async (req, res) => {
    try {
        const pendingRequests = await AdminRequest.find({ status: 'pending' });

        const summary = pendingRequests.map(req => ({
            id: req._id,
            name: req.name,
            email: req.email,
            role: req.role,
            department: req.department,
            reason: req.reason,
            requestedAt: req.requestedAt
        }));

        res.json({
            count: summary.length,
            requests: summary
        });
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
});

/**
 * @route   GET /admin-management/requests/all
 * @desc    Get all admin requests (pending, approved, rejected)
 * @access  Private (super-admin)
 */
router.get('/requests/all', verifyAdminToken, verifySuperAdmin, async (req, res) => {
    try {
        const allRequests = await AdminRequest.find()
            .populate('approvedBy', 'name email')
            .sort({ requestedAt: -1 });

        const grouped = {
            pending: [],
            approved: [],
            rejected: []
        };

        allRequests.forEach(req => {
            const summary = req.getSummary();
            if (req.approvedBy) {
                summary.approvedByName = req.approvedBy.name;
                summary.approvedByEmail = req.approvedBy.email;
            }
            grouped[req.status].push(summary);
        });

        res.json({
            pending: { count: grouped.pending.length, requests: grouped.pending },
            approved: { count: grouped.approved.length, requests: grouped.approved },
            rejected: { count: grouped.rejected.length, requests: grouped.rejected },
            total: allRequests.length
        });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
});

/**
 * @route   GET /admin-management/request/:id
 * @desc    Get specific admin request details
 * @access  Private (super-admin)
 */
router.get('/request/:id', verifyAdminToken, verifySuperAdmin, async (req, res) => {
    try {
        const adminRequest = await AdminRequest.findById(req.params.id)
            .populate('approvedBy', 'name email');

        if (!adminRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json(adminRequest.getSummary());
    } catch (error) {
        console.error('Error fetching request:', error);
        res.status(500).json({ message: 'Error fetching request', error: error.message });
    }
});

// ================== APPROVAL ENDPOINTS ==================

/**
 * @route   POST /admin-management/approve-request/:id
 * @desc    Approve an admin request and create admin account
 * @access  Private (super-admin)
 */
router.post('/approve-request/:id', verifyAdminToken, verifySuperAdmin, async (req, res) => {
    try {
        const { permissions } = req.body;
        const adminRequest = await AdminRequest.findById(req.params.id);

        if (!adminRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (adminRequest.status !== 'pending') {
            return res.status(400).json({ message: `Request is already ${adminRequest.status}` });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: adminRequest.email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin account already exists for this email' });
        }

        // Get the raw password and admin code before they're hashed in the request
        const rawPassword = adminRequest.password;
        const rawAdminCode = adminRequest.adminCode;

        // Create new admin account
        const newAdmin = await Admin.create({
            name: adminRequest.name,
            email: adminRequest.email,
            password: rawPassword,
            adminCode: rawAdminCode,
            role: adminRequest.role,
            status: 'active',
            permissions: permissions || adminRequest.permissions
        });

        // Update request status
        adminRequest.status = 'approved';
        adminRequest.approvedBy = req.admin._id;
        adminRequest.approvedAt = new Date();
        await adminRequest.save();

        // Send approval email to new admin
        try {
            await sendEmail(
                adminRequest.email,
                'Admin Account Approved',
                `
                <h2>Your Admin Access Request Has Been Approved!</h2>
                <p>Hello ${adminRequest.name},</p>
                <p>Your request for admin access has been approved by ${req.admin.name}.</p>
                <p><strong>Your admin account is now active.</strong></p>
                <p><strong>Credentials:</strong></p>
                <ul>
                    <li><strong>Email:</strong> ${adminRequest.email}</li>
                    <li><strong>Role:</strong> ${adminRequest.role}</li>
                </ul>
                <p>You can now login to the admin dashboard with your email, password, and admin code.</p>
                <p><strong>Admin Dashboard:</strong> <a href="${process.env.ADMIN_DASHBOARD_URL || 'http://localhost:5174'}/admin-login">Click here to login</a></p>
                <p>If you did not request this, please contact your administrator.</p>
                `
            );
        } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
        }

        res.json({
            message: 'Admin request approved successfully',
            admin: {
                id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
                role: newAdmin.role,
                status: newAdmin.status,
                permissions: newAdmin.permissions
            },
            approvedAt: adminRequest.approvedAt
        });
    } catch (error) {
        console.error('Error approving request:', error);
        res.status(500).json({ message: 'Error approving request', error: error.message });
    }
});

/**
 * @route   POST /admin-management/reject-request/:id
 * @desc    Reject an admin request
 * @access  Private (super-admin)
 */
router.post('/reject-request/:id', verifyAdminToken, verifySuperAdmin, async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        if (reason.length > 500) {
            return res.status(400).json({ message: 'Reason cannot exceed 500 characters' });
        }

        const adminRequest = await AdminRequest.findById(req.params.id);

        if (!adminRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (adminRequest.status !== 'pending') {
            return res.status(400).json({ message: `Request is already ${adminRequest.status}` });
        }

        // Update request status
        adminRequest.status = 'rejected';
        adminRequest.rejectionReason = reason;
        adminRequest.rejectedAt = new Date();
        adminRequest.approvedBy = req.admin._id; // Track who rejected it
        await adminRequest.save();

        // Send rejection email to requester
        try {
            await sendEmail(
                adminRequest.email,
                'Admin Access Request - Not Approved',
                `
                <h2>Your Admin Access Request</h2>
                <p>Hello ${adminRequest.name},</p>
                <p>Your request for admin access has been reviewed and not approved at this time.</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p>If you have any questions, please contact the administrator.</p>
                `
            );
        } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
        }

        res.json({
            message: 'Admin request rejected successfully',
            request: {
                id: adminRequest._id,
                email: adminRequest.email,
                status: adminRequest.status,
                rejectionReason: adminRequest.rejectionReason,
                rejectedAt: adminRequest.rejectedAt
            }
        });
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ message: 'Error rejecting request', error: error.message });
    }
});

/**
 * @route   DELETE /admin-management/cancel-request/:id
 * @desc    Cancel a pending admin request
 * @access  Private (requester or super-admin)
 */
router.delete('/cancel-request/:id', verifyAdminToken, async (req, res) => {
    try {
        const adminRequest = await AdminRequest.findById(req.params.id);

        if (!adminRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (adminRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending requests can be cancelled' });
        }

        // Only super-admin or original requester (based on email if available) can cancel
        // For now, only super-admin can cancel
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ message: 'Only super-admins can cancel requests' });
        }

        await AdminRequest.deleteOne({ _id: req.params.id });

        res.json({
            message: 'Admin request cancelled successfully',
            request: { email: adminRequest.email }
        });
    } catch (error) {
        console.error('Error cancelling request:', error);
        res.status(500).json({ message: 'Error cancelling request', error: error.message });
    }
});

module.exports = router;
