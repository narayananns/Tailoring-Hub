const express = require('express');
const router = express.Router();
const Machine = require('../models/Machine');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/machines';
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'machine-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: Images Only!'));
    }
});

// @route   GET /api/machines
// @desc    Get all machines
// @access  Public
router.get('/', async (req, res) => {
    try {
        const machines = await Machine.find().sort({ createdAt: -1 });
        res.json(machines);
    } catch (err) {
        console.error('Error fetching machines:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   GET /api/machines/:id
// @desc    Get single machine
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const machine = await Machine.findById(req.params.id);
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }
        res.json(machine);
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Machine not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/machines
// @desc    Add a new machine
// @access  Private (Admin)
router.post('/', upload.array('images', 5), async (req, res) => {
    try {
        const { 
            name, brand, type, price, originalPrice, 
            description, features, specifications, stock, status 
        } = req.body;

        // Process images
        const images = req.files ? req.files.map(file => `/uploads/machines/${file.filename}`) : [];

        // Parse JSON strings if they come as strings (common with FormData)
        let parsedFeatures = [];
        if (typeof features === 'string') {
            try {
                parsedFeatures = JSON.parse(features);
            } catch (e) {
                parsedFeatures = features.split(',').map(f => f.trim());
            }
        } else if (Array.isArray(features)) {
            parsedFeatures = features;
        }

        let parsedSpecs = {};
        if (typeof specifications === 'string') {
            try {
                parsedSpecs = JSON.parse(specifications);
            } catch (e) {
                console.error("Error parsing specifications JSON", e);
            }
        } else if (typeof specifications === 'object') {
            parsedSpecs = specifications;
        }

        const newMachine = new Machine({
            name,
            brand,
            type,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            description,
            features: parsedFeatures,
            specifications: parsedSpecs,
            images,
            stock: Number(stock),
            status: status || 'Available'
        });

        const savedMachine = await newMachine.save();
        res.status(201).json(savedMachine);
    } catch (err) {
        console.error('Error adding machine:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   PUT /api/machines/:id
// @desc    Update a machine
// @access  Private (Admin)
router.put('/:id', upload.array('images', 5), async (req, res) => {
    try {
        const { 
            name, brand, type, price, originalPrice, 
            description, features, specifications, stock, status,
            existingImages // URLs of images to keep
        } = req.body;

        let machine = await Machine.findById(req.params.id);
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }

        // Process new images
        const newImages = req.files ? req.files.map(file => `/uploads/machines/${file.filename}`) : [];
        
        // Combine existing (kept) images and new images
        let updatedImages = [];
        if (existingImages) {
            updatedImages = Array.isArray(existingImages) ? existingImages : [existingImages];
        }
        updatedImages = [...updatedImages, ...newImages];

        // Parse complex fields
        let parsedFeatures = machine.features;
        if (features) {
             if (typeof features === 'string') {
                try {
                    parsedFeatures = JSON.parse(features);
                } catch (e) {
                    parsedFeatures = features.split(',').map(f => f.trim());
                }
            } else {
                parsedFeatures = features;
            }
        }

        let parsedSpecs = machine.specifications;
        if (specifications) {
            if (typeof specifications === 'string') {
                try {
                    parsedSpecs = JSON.parse(specifications);
                } catch (e) { console.error(e); }
            } else {
                parsedSpecs = specifications;
            }
        }

        machine.name = name || machine.name;
        machine.brand = brand || machine.brand;
        machine.type = type || machine.type;
        machine.price = price ? Number(price) : machine.price;
        machine.originalPrice = originalPrice ? Number(originalPrice) : machine.originalPrice;
        machine.description = description || machine.description;
        machine.features = parsedFeatures;
        machine.specifications = parsedSpecs;
        if (updatedImages.length > 0) machine.images = updatedImages;
        machine.stock = stock !== undefined ? Number(stock) : machine.stock;
        machine.status = status || machine.status;

        const updatedMachine = await machine.save();
        res.json(updatedMachine);
    } catch (err) {
        console.error('Error updating machine:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   DELETE /api/machines/:id
// @desc    Delete a machine
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const machine = await Machine.findById(req.params.id);
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }

        await Machine.findByIdAndDelete(req.params.id);
        res.json({ message: 'Machine removed' });
    } catch (err) {
        console.error('Error deleting machine:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
