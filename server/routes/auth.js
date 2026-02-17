const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { sendOTP, sendWelcomeEmail } = require('../utils/emailService');

const router = express.Router();

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'tmms-secret-key-2024';
const ADMIN_CODE = process.env.ADMIN_CODE || 'TMMS-ADMIN-2024';

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
        res.status(500).json({ message: 'Failed to resend OTP' });
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
                message: 'Email not verified. Please verify your email.',
                isVerified: false
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
router.post('/admin/register', async (req, res) => {
    try {
        const { name, email, phone, password, adminCode } = req.body;

        // Verify admin code
        if (adminCode !== ADMIN_CODE) {
            return res.status(403).json({ message: 'Invalid admin access code' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create admin
        const user = await User.create({
            name,
            email,
            phone,
            password,
            role: 'admin'
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'Admin registration successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password, adminCode } = req.body;

        // Verify admin code
        if (adminCode !== ADMIN_CODE) {
            return res.status(403).json({ message: 'Invalid admin access code' });
        }

        // Find admin user
        const user = await User.findOne({ email, role: 'admin' });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or not an admin' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePhoto: user.profilePhoto,
                accountId: user.accountId
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
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
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

module.exports = router;
