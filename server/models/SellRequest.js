const mongoose = require('mongoose');

const sellRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional, in case guest users can sell
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    machineType: {
        type: String,
        required: [true, 'Machine type is required']
    },
    brand: {
        type: String,
        required: [true, 'Brand is required']
    },
    model: {
        type: String,
        required: [true, 'Model is required']
    },
    age: {
        type: String,
        required: [true, 'Age of machine is required']
    },
    condition: {
        type: String,
        required: [true, 'Condition is required']
    },
    description: {
        type: String,
        trim: true
    },
    expectedPrice: {
        type: Number,
        required: [true, 'Expected price is required']
    },
    photos: [{
        type: String // URLs to uploaded photos
    }],
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Sold'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SellRequest', sellRequestSchema);
