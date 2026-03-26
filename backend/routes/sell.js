const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const SellRequest = require('../models/SellRequest');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'tmms-dev-secret';

// Middleware to attach user if token present (Optional Auth)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user) {
                req.user = user;
            }
        }
    } catch (error) {
        // Token invalid or expired, proceed as guest
        console.log('Optional auth token error:', error.message);
    }
    next();
};

// Strict Auth Middleware (Required for retrieving history)
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'Authentication required' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: 'User not found' });

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Configure Multer for Sell Requests
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'sell-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5 // Max 5 files
    }
});

// @route   POST /api/sell-requests
// @desc    Create a new sell request
// @access  Public (Optional Auth)
router.post('/', upload.array('photos', 5), async (req, res, next) => {
    // Manually handle token inside the handler or use middleware
    // Let's reuse optionalAuth logic here directly or call it
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let userId = null;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            userId = decoded.id;
        } catch (err) {
            console.log('Token error in sell request:', err.message);
        }
    }

    try {
        console.log('Sell request body:', req.body);
        
        const photoUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        
        // Parse numbers if they come as strings
        const expectedPrice = parseFloat(req.body.expectedPrice);

        const newSellRequest = new SellRequest({
            ...req.body,
            userId: userId, // Attach userId if found
            expectedPrice,
            photos: photoUrls
        });

        const savedRequest = await newSellRequest.save();

        res.status(201).json({
            message: 'Sell request submitted successfully',
            data: savedRequest
        });
    } catch (error) {
        console.error('Error creating sell request:', error);
        res.status(500).json({
            message: 'Server error while processing your request',
            error: error.message
        });
    }
});

// @route   GET /api/sell-requests/my-requests
// @desc    Get logged-in user's sell requests
// @access  Private
router.get('/my-requests', auth, async (req, res) => {
    try {
        const requests = await SellRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/sell-requests
// @desc    Get all sell requests (Admin)
// @access  Private (TODO: Add auth middleware)
router.get('/', async (req, res) => {
    try {
        const requests = await SellRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/sell-requests/:id/status
// @desc    Update sell request status
// @access  Private (Admin)
router.put('/:id/status', async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        
        const updateData = { status };
        if (rejectionReason !== undefined) {
            updateData.rejectionReason = rejectionReason;
        }

        const request = await SellRequest.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!request) {
            return res.status(404).json({ message: 'Sell request not found' });
        }

        res.json(request);
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/sell-requests/:id
// @desc    Delete a sell request (User can delete their own, Admin can delete any)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const request = await SellRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Sell request not found' });
        }

        // Check if user owns the request or is admin (assuming admin check middleware or role check)
        // For now, let's just check ownership. In a real app, admins should bypass this check.
        // Assuming req.user from auth middleware has role 'admin'
        if (request.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to delete this request' });
        }

        await SellRequest.findByIdAndDelete(req.params.id);
        res.json({ message: 'Sell request removed' });
    } catch (error) {
        console.error('Error deleting sell request:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
