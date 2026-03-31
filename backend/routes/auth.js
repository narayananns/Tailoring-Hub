const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { sendOTP, sendWelcomeEmail } = require('../utils/emailService');

const router = express.Router();

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_CODE = process.env.ADMIN_CODE;

if (!JWT_SECRET || !ADMIN_CODE) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error("JWT_SECRET and ADMIN_CODE must be set in production");
    }
}

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ================== CUSTOMER ROUTES ==================

// Customer Registration
router.post('/customer/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Validate phone format
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create customer
        const user = await User.create({
            name,
            email,
            phone,
            password,
            role: 'customer',
            isVerified: false,
            otp,
            otpExpires
        });

        // Send OTP Email
        await sendOTP(email, otp, 'verification');

        res.status(201).json({
            message: 'Registration successful. Please verify your email.',
            email: user.email
        });
    } catch (error) {
        console.error('Customer registration error:', error);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        
        // Handle duplicate key error (unique constraint)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Send Welcome Email
        await sendWelcomeEmail(user.email, user.name);

        // Generate token
        const token = generateToken(user._id);

        res.json({
            message: 'Email verified successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Verification failed', error: error.message });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendOTP(email, otp, 'verification');

        res.json({ message: 'OTP resent successfully' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
    }
});

// Customer Login
router.post('/customer/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email, role: 'customer' });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check verification
        if (!user.isVerified) {
            return res.status(403).json({
                message: 'Email not verified. Please verify your email first to login.',
                isVerified: false,
                email: user.email,
                needsVerification: true
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profilePhoto: user.profilePhoto,
                accountId: user.accountId
            }
        });
    } catch (error) {
        console.error('Customer login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// Check email status (for signup/login)
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({
                exists: false,
                available: true,
                message: 'Email is available for registration'
            });
        }

        // Email exists
        res.status(200).json({
            exists: true,
            available: false,
            isVerified: user.isVerified,
            message: user.isVerified 
                ? 'Email already registered and verified. Please login or use a different email.'
                : 'Email registered but not verified. Please verify your email and login.',
            action: user.isVerified ? 'login' : 'verify'
        });
    } catch (error) {
        console.error('Check email error:', error);
        res.status(500).json({ message: 'Error checking email', error: error.message });
    }
});

// Admin endpoint to manually verify test accounts (for development/testing)
router.post('/admin/verify-user-email', async (req, res) => {
    try {
        const { email, adminCode } = req.body;

        // Verify admin privilege
        if (adminCode !== process.env.ADMIN_CODE) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User email already verified' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({
            message: 'User email verified successfully',
            user: {
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Admin verify error:', error);
        res.status(500).json({ message: 'Error verifying user', error: error.message });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendOTP(email, otp, 'reset');

        res.json({ message: 'Password reset OTP sent' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to process request' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.password = newPassword; // Will be hashed by pre-save hook
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reset password' });
    }
});


// ================== ADMIN ROUTES ==================

// Admin Registration
// Admin Registration
router.post('/admin/register', async (req, res) => {
    try {
        const { name, email, password, adminCode } = req.body;

        // Validate required fields
        if (!name || !email || !password || !adminCode) {
            return res.status(400).json({ message: 'All fields (name, email, password, adminCode) are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Verify admin code
        if (adminCode !== ADMIN_CODE) {
            return res.status(403).json({ message: 'Invalid admin access code' });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin with this email already exists' });
        }

        // Create new admin
        const newAdmin = await Admin.create({
            name,
            email,
            password,
            adminCode,
            role: 'admin',
            status: 'active'
        });

        // Generate token
        const token = generateToken(newAdmin._id);

        res.status(201).json({
            message: 'Admin registration successful',
            token,
            user: {
                id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
                role: newAdmin.role,
                status: newAdmin.status
            }
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// Admin Login
// Admin Login
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password, adminCode } = req.body;

        // Validate required fields
        if (!email || !password || !adminCode) {
            return res.status(400).json({ message: 'Email, password, and admin code are required' });
        }

        // Check if account is locked (brute force protection)
        const admin = await Admin.findOne({ email }).select('+password +adminCode');
        
        if (!admin) {
            return res.status(401).json({ 
                message: 'Invalid credentials',
                code: 'ADMIN_NOT_FOUND'
            });
        }

        if (admin.isLocked && admin.lockedUntil > new Date()) {
            return res.status(403).json({ 
                message: 'Account is locked due to too many failed attempts. Please try again later.',
                lockedUntil: admin.lockedUntil,
                code: 'ACCOUNT_LOCKED'
            });
        }

        // CRITICAL: Check if account status is ACTIVE (approved)
        // Prevent login for pending, inactive, or suspended accounts
        if (admin.status !== 'active') {
            console.log(`[ADMIN LOGIN BLOCKED] ${email} - Status: ${admin.status}`);
            
            const statusMessages = {
                'pending': 'Your registration request is pending super-admin approval. Please wait for approval.',
                'inactive': 'Your account has been deactivated. Contact the administrator.',
                'suspended': 'Your account has been suspended. Contact the administrator.'
            };
            
            return res.status(403).json({ 
                message: statusMessages[admin.status] || `Account is ${admin.status}. Contact administrator.`,
                status: admin.status,
                code: 'ACCOUNT_NOT_APPROVED',
                needsApproval: admin.status === 'pending'
            });
        }

        // Verify admin code
        const isAdminCodeValid = await admin.compareAdminCode(adminCode);
        if (!isAdminCodeValid) {
            await admin.incrementLoginAttempts();
            return res.status(403).json({ message: 'Invalid admin access code' });
        }

        // Verify password
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            await admin.incrementLoginAttempts();
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Reset login attempts on successful login
        await admin.resetLoginAttempts();

        // Generate token
        const token = generateToken(admin._id);

        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                status: admin.status,
                permissions: admin.permissions,
                profilePhoto: admin.profilePhoto
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// Verify Token (for protected routes)
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Try to find as customer first
        let user = await User.findById(decoded.id).select('-password');
        
        // If not found as customer, try as admin
        if (!user) {
            user = await Admin.findById(decoded.id).select('-password -adminCode');
            
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }
            
            // Return admin user
            return res.json({
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    permissions: user.permissions,
                    profilePhoto: user.profilePhoto
                }
            });
        }

        // Generate Account ID if missing (for existing users)
        if (!user.accountId) {
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(10 + Math.random() * 90);
            user.accountId = `TMMS-${timestamp}${random}`;
            await user.save();
        }

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profilePhoto: user.profilePhoto,
                accountId: user.accountId
            }
        });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Configure Multer for Profile Photos
const uploadsDir = path.join(__dirname, '../uploads');
// Ensure directory exists (redundant if server.js runs first, but safe)
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Create a protect middleware for internal use in this file
const protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Wrapper for upload to handle errors and return JSON instead of HTML
const uploadMiddleware = (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(400).json({ message: `File upload error: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).json({ message: err.message });
        }
        // Everything went fine.
        next();
    });
};

// Update Profile Photo
router.put('/profile/photo', protect, uploadMiddleware, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const user = req.user;

        // Optional: Delete old photo if it exists and is a local file
        if (user.profilePhoto && user.profilePhoto.startsWith('/uploads/user-')) {
            const oldPath = path.join(__dirname, '..', user.profilePhoto);
            try {
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            } catch (err) {
                console.error('Error deleting old photo:', err);
            }
        }

        user.profilePhoto = `/uploads/${req.file.filename}`;
        await user.save();

        res.json({
            message: 'Profile photo updated successfully',
            profilePhoto: user.profilePhoto
        });
    } catch (error) {
        console.error('Profile upload error:', error);
        res.status(500).json({ message: 'Error uploading photo', error: error.message });
    }
});

// Update Profile Details
router.put('/profile/update', protect, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const user = req.user;

        if (name) user.name = name;
        if (phone) user.phone = phone;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profilePhoto: user.profilePhoto,
                accountId: user.accountId
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
});

// ================== ADMIN DASHBOARD ACCESS CONTROL ==================

// Admin Dashboard Access Verification
// Purpose: Verify admin is approved and active before granting dashboard access
router.get('/admin/verify-access', async (req, res) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                canAccess: false,
                reason: 'No authentication token provided'
            });
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                canAccess: false,
                reason: 'Invalid or expired token'
            });
        }

        // Find admin in database
        const admin = await Admin.findById(decoded.id).select('-password -adminCode');

        if (!admin) {
            return res.status(401).json({
                canAccess: false,
                reason: 'Admin account not found. Account may have been deleted.'
            });
        }

        // Check admin status - CRITICAL CHECK
        if (admin.status !== 'active') {
            console.log(`[ADMIN DASHBOARD] Access denied for ${admin.email} - Status: ${admin.status}`);
            
            return res.status(403).json({
                canAccess: false,
                reason: `Your account status is "${admin.status}". Access to dashboard is denied. Contact super-admin for approval.`,
                admin: {
                    name: admin.name,
                    email: admin.email,
                    status: admin.status,
                    role: admin.role
                }
            });
        }

        // Log successful dashboard access attempt
        console.log(`[ADMIN DASHBOARD] ✅ Access granted for ${admin.email} (${admin.role})`);

        // Grant access with admin data
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
        console.error('Admin access verification error:', error);
        res.status(500).json({
            canAccess: false,
            reason: 'Server error during access verification'
        });
    }
});

// ================== ADMIN PROFILE ENDPOINTS ==================

// Get Admin Profile (for any logged-in admin)
router.get('/admin/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No authentication token' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const admin = await Admin.findById(decoded.id).select('-password -adminCode');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json({
            message: 'Profile retrieved successfully',
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                status: admin.status,
                permissions: admin.permissions,
                profilePhoto: admin.profilePhoto,
                createdAt: admin.createdAt,
                lastLogin: admin.lastLogin,
                isSuperAdmin: admin.role === 'super-admin'
            }
        });
    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({ message: 'Error retrieving profile' });
    }
});

// Update Admin Profile
router.put('/admin/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No authentication token' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const { name } = req.body;

        const admin = await Admin.findByIdAndUpdate(
            decoded.id,
            { name },
            { new: true, runValidators: true }
        ).select('-password -adminCode');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                status: admin.status,
                permissions: admin.permissions,
                profilePhoto: admin.profilePhoto
            }
        });
    } catch (error) {
        console.error('Update admin profile error:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// Get all admin requests (super-admin only)
router.get('/admin/requests', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No authentication token' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const admin = await Admin.findById(decoded.id).select('-password -adminCode');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Only super-admins can view all requests
        if (admin.role !== 'super-admin') {
            return res.status(403).json({ 
                message: 'Only super-admins can view admin requests',
                code: 'SUPER_ADMIN_REQUIRED'
            });
        }

        const AdminRequest = require('../models/AdminRequest');
        
        // Get all requests with different statuses
        const pendingRequests = await AdminRequest.find({ status: 'pending' }).sort({ requestedAt: -1 });
        const approvedRequests = await AdminRequest.find({ status: 'approved' })
            .populate('approvedBy', 'name email')
            .sort({ approvedAt: -1 });
        const rejectedRequests = await AdminRequest.find({ status: 'rejected' })
            .sort({ rejectedAt: -1 });

        res.json({
            message: 'Admin requests retrieved successfully',
            counts: {
                pending: pendingRequests.length,
                approved: approvedRequests.length,
                rejected: rejectedRequests.length,
                total: pendingRequests.length + approvedRequests.length + rejectedRequests.length
            },
            requests: {
                pending: pendingRequests,
                approved: approvedRequests,
                rejected: rejectedRequests
            }
        });
    } catch (error) {
        console.error('Get admin requests error:', error);
        res.status(500).json({ message: 'Error retrieving requests' });
    }
});

// Get pending admin requests only (super-admin)
router.get('/admin/pending-requests', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No authentication token' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const admin = await Admin.findById(decoded.id).select('-password -adminCode');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (admin.role !== 'super-admin') {
            return res.status(403).json({ 
                message: 'Only super-admins can view pending requests',
                code: 'SUPER_ADMIN_REQUIRED'
            });
        }

        const AdminRequest = require('../models/AdminRequest');
        const pendingRequests = await AdminRequest.find({ status: 'pending' }).sort({ requestedAt: -1 });

        res.json({
            message: 'Pending admin requests retrieved',
            count: pendingRequests.length,
            requests: pendingRequests
        });
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({ message: 'Error retrieving pending requests' });
    }
});

module.exports = router;
