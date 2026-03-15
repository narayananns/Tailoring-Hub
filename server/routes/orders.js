const express = require('express');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendOrderStatusUpdate } = require('../utils/emailService');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'tmms-dev-secret';

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Create new order
router.post('/create', auth, async (req, res) => {
    try {
        const { items, shippingDetails, paymentMethod, totalAmount } = req.body;

        // Generate IDs
        const timestamp = Date.now().toString();
        const orderId = 'ORD' + timestamp.slice(-8);
        const transactionId = 'TRX' + timestamp + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

        const order = new Order({
            orderId,
            transactionId,
            userId: req.user._id,
            items,
            totalAmount,
            shippingDetails,
            paymentMethod,
            status: 'pending'
        });

        await order.save();

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: {
                orderId: order.orderId,
                transactionId: order.transactionId,
                totalAmount: order.totalAmount,
                status: order.status,
                createdAt: order.createdAt
            }
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    }
});

// Get user's orders
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.json({ orders });
    } catch (error) {
        console.error('Fetch orders error:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

// Get order by transaction ID
router.get('/transaction/:transactionId', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            transactionId: req.params.transactionId,
            userId: req.user._id
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch order details' });
    }
});

// Get single order details
router.get('/:orderId', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            orderId: req.params.orderId,
            userId: req.user._id
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch order details' });
    }
});

// Get all orders (Admin only - placeholder auth check)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ orders, count: orders.length });
    } catch (error) {
        console.error('Fetch all orders error:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

// Get single order for admin
router.get('/admin/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        console.error('Fetch order details error:', error);
        res.status(500).json({ message: 'Failed to fetch order details' });
    }
});

// Update order status
router.put('/:id/status', async (req, res) => {
    try {
        const { status, cancellationReason } = req.body;
        const updateData = { status };
        if (status === 'cancelled' && cancellationReason) {
            updateData.cancellationReason = cancellationReason;
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (order && order.shippingDetails && order.shippingDetails.email) {
            // Send email notification asynchronously
            sendOrderStatusUpdate(
                order.shippingDetails.email, 
                order.orderId || order._id, 
                status, 
                status === 'cancelled' ? cancellationReason : ''
            ).catch(err => console.error('Failed to send status email:', err));
        }

        res.json(order);
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Failed to update order status' });
    }
});

module.exports = router;
