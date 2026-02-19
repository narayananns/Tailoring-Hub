const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SellRequest = require('../models/SellRequest');

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
// @access  Public
router.post('/', upload.array('photos', 5), async (req, res) => {
    try {
        console.log('Sell request body:', req.body);
        
        const photoUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        
        // Parse numbers if they come as strings
        const expectedPrice = parseFloat(req.body.expectedPrice);

        const newSellRequest = new SellRequest({
            ...req.body,
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

module.exports = router;
