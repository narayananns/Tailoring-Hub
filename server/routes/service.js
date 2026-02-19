const express = require('express');
const router = express.Router();
const ServiceBooking = require('../models/ServiceBooking');

// @route   POST /api/service-bookings
// @desc    Create a new service booking
// @access  Public
router.post('/', async (req, res) => {
    try {
        console.log('Service booking body:', req.body);
        
        const newServiceBooking = new ServiceBooking({
            ...req.body
        });

        const savedBooking = await newServiceBooking.save();

        res.status(201).json({
            message: 'Service booking created successfully',
            data: savedBooking
        });
    } catch (error) {
        console.error('Error creating service booking:', error);
        res.status(500).json({
            message: 'Server error while processing your request',
            error: error.message
        });
    }
});

// @route   GET /api/service-bookings
// @desc    Get all service bookings (Admin)
// @access  Private (TODO: Add auth middleware)
router.get('/', async (req, res) => {
    try {
        const bookings = await ServiceBooking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
