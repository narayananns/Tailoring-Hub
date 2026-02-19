const mongoose = require('mongoose');

const serviceBookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: false // Optional, in case guest users can book
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
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    machineType: {
        type: String,
        required: [true, 'Machine type is required']
    },
    brand: {
        type: String,
        required: [true, 'Brand/Model details are required']
    },
    model: {
        type: String,
        required: false
    },
    issue: {
        type: String,
        required: [true, 'Issue description is required'],
        trim: true
    },
    preferredDate: {
        type: Date,
        required: [true, 'Preferred service date is required']
    },
    preferredTime: {
        type: String,
        required: [true, 'Preferred time is required']
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);
