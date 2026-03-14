const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Industrial', 'Domestic', 'Embroidery', 'Overlock', 'Cutting'],
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    features: [{
        type: String
    }],
    specifications: {
        speed: String,
        stitchType: String,
        needleType: String,
        motorPower: String,
        weight: String,
        warranty: String
    },
    images: [{
        type: String, // URL or path
        required: true
    }],
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['Available', 'Out of Stock', 'Discontinued'],
        default: 'Available'
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviews: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Machine', machineSchema);
