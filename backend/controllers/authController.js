const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTP, sendWelcomeEmail } = require('../utils/emailService');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'tmms-secret-key-2024';
const ADMIN_CODE = process.env.ADMIN_CODE || 'TMMS-ADMIN-2024';

// Helper: Generate Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Helper: Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Register a new customer
 * @route   POST /api/auth/customer/register
 * @access  Public
 */
const registerCustomer = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create customer
        const user = await User.create({
            name,
            email,
            phone,
            password, // Password will be hashed in User model pre-save hook
            role: 'customer',
            isVerified: false,
            otp,
            otpExpires
        });

        // Send OTP Email
        try {
            await sendOTP(email, otp, 'verification');
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail registration if email fails, but warn user
            // return res.status(500).json({ success: false, message: 'Email sending failed' });
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please verify your email.',
            data: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Login customer
 * @route   POST /api/auth/customer/login
 * @access  Public
 */
const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Check user
        const user = await User.findOne({ email, role: 'customer' });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check verification
        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: 'Email not verified', isVerified: false });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Export all controllers
module.exports = {
    registerCustomer,
    loginCustomer
};
