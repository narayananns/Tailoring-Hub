/**
 * BACKEND ADMIN ACCESS VERIFICATION MIDDLEWARE
 * 
 * Purpose: Verify admin is approved and has access to admin dashboard
 * - Check JWT token validity
 * - Verify admin exists in database
 * - Check admin status (active/inactive/suspended)
 * - Ensure super-admin has all permissions
 * - Log all access attempts for audit trail
 */

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Verify admin access to dashboard
const verifyAdminAccess = async (req, res) => {
    try {
        // 1. Get token from header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                canAccess: false,
                reason: 'No authentication token provided'
            });
        }

        // 2. Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                canAccess: false,
                reason: 'Invalid or expired token'
            });
        }

        // 3. Find admin in database
        const admin = await Admin.findById(decoded.id).select('-password -adminCode');

        if (!admin) {
            return res.status(401).json({
                canAccess: false,
                reason: 'Admin account not found. Account may have been deleted.'
            });
        }

        // 4. Check admin status
        if (admin.status !== 'active') {
            return res.status(403).json({
                canAccess: false,
                reason: `Your account status is "${admin.status}". Access denied.`,
                admin: {
                    name: admin.name,
                    email: admin.email,
                    status: admin.status,
                    role: admin.role
                }
            });
        }

        // 5. Log access attempt (audit trail)
        console.log(`[ADMIN ACCESS] ${admin.email} (${admin.role}) - Dashboard Access Granted`);

        // 6. Grant access
        return res.status(200).json({
            canAccess: true,
            reason: 'Access granted',
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                status: admin.status,
                permissions: admin.permissions,
                isSuperAdmin: admin.role === 'super-admin'
            }
        });

    } catch (error) {
        console.error('Access verification error:', error);
        res.status(500).json({
            canAccess: false,
            reason: 'Server error during access verification'
        });
    }
};

// Middleware to check admin dashboard access
const requireAdminAccess = async (req, res, next) => {
    try {
        // 1. Get token from header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                error: 'No authentication token provided',
                code: 'NO_TOKEN'
            });
        }

        // 2. Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ 
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }

        // 3. Find admin in database
        const admin = await Admin.findById(decoded.id).select('-password -adminCode');

        if (!admin) {
            return res.status(401).json({ 
                error: 'Admin account not found',
                code: 'ADMIN_NOT_FOUND'
            });
        }

        // 4. Check admin status
        if (admin.status !== 'active') {
            return res.status(403).json({ 
                error: `Access denied. Account status: ${admin.status}`,
                code: 'ACCOUNT_NOT_ACTIVE',
                admin: {
                    status: admin.status,
                    role: admin.role
                }
            });
        }

        // 5. Attach admin to request for use in route handlers
        req.admin = admin;
        req.adminId = admin._id;

        next();

    } catch (error) {
        console.error('Admin access middleware error:', error);
        res.status(500).json({ 
            error: 'Server error during authorization',
            code: 'AUTH_ERROR'
        });
    }
};

// Middleware to check super-admin access
const requireSuperAdminAccess = async (req, res, next) => {
    try {
        // First, run the general admin access check
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                error: 'No authentication token provided',
                code: 'NO_TOKEN'
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ 
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }

        const admin = await Admin.findById(decoded.id).select('-password -adminCode');

        if (!admin) {
            return res.status(401).json({ 
                error: 'Admin account not found',
                code: 'ADMIN_NOT_FOUND'
            });
        }

        if (admin.status !== 'active') {
            return res.status(403).json({ 
                error: `Access denied. Account status: ${admin.status}`,
                code: 'ACCOUNT_NOT_ACTIVE'
            });
        }

        // Super-admin specific check
        if (admin.role !== 'super-admin') {
            console.log(`[DENIED] ${admin.email} (${admin.role}) attempted super-admin access`);
            return res.status(403).json({ 
                error: 'Super-admin access required',
                code: 'SUPER_ADMIN_ONLY',
                admin: {
                    role: admin.role
                }
            });
        }

        req.admin = admin;
        req.adminId = admin._id;

        next();

    } catch (error) {
        console.error('Super-admin access middleware error:', error);
        res.status(500).json({ 
            error: 'Server error during authorization',
            code: 'AUTH_ERROR'
        });
    }
};

module.exports = {
    verifyAdminAccess,
    requireAdminAccess,
    requireSuperAdminAccess
};
