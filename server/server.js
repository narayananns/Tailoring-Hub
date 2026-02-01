const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tmms';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'machine-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP are allowed.'), false);
    }
};

// Configure multer upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 5 // Max 5 files
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Import Routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Basic route
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to TMMS API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            machines: '/api/machines',
            spareParts: '/api/spare-parts',
            sellRequests: '/api/sell-requests',
            serviceBookings: '/api/service-bookings',
            contacts: '/api/contacts'
        }
    });
});

// Placeholder routes - will be expanded later
app.get('/api/machines', (req, res) => {
    res.json({
        message: 'Machines endpoint',
        data: []
    });
});

app.get('/api/spare-parts', (req, res) => {
    res.json({
        message: 'Spare parts endpoint',
        data: []
    });
});

// Sell request with photo upload
app.post('/api/sell-requests', upload.array('photos', 5), (req, res) => {
    console.log('Sell request received:', req.body);
    console.log('Files uploaded:', req.files?.length || 0);

    // Get uploaded file paths
    const photoUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    res.json({
        message: 'Sell request received successfully',
        data: {
            ...req.body,
            photos: photoUrls
        }
    });
});

app.post('/api/service-bookings', (req, res) => {
    console.log('Service booking received:', req.body);
    res.json({
        message: 'Service booking received successfully',
        data: req.body
    });
});

app.post('/api/contacts', (req, res) => {
    console.log('Contact message received:', req.body);
    res.json({
        message: 'Message received successfully',
        data: req.body
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 TMMS Server running on port ${PORT}`);
});
