const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const JWT_SECRET = process.env.JWT_SECRET || 'tmms-secret-key-2024';
const User = require('../models/User');

// Middleware to verify JWT token (matching orders.js pattern)
const verifyToken = async (req, res, next) => {
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
        console.error('Payment auth error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Create Razorpay Order
router.post('/create-order', verifyToken, async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        if (!amount) {
            return res.status(400).json({ message: 'Amount is required' });
        }

        // Create order options
        const options = {
            amount: amount * 100, // Convert to paise (smallest currency unit)
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1 // Auto capture payment
        };

        // Create Razorpay order
        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            },
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error.message
        });
    }
});

// Verify Razorpay Payment
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing payment verification parameters'
            });
        }

        // Create signature for verification
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        // Verify signature
        if (razorpay_signature === expectedSign) {
            res.json({
                success: true,
                message: 'Payment verified successfully',
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        });
    }
});

// Get payment details
router.get('/payment/:paymentId', verifyToken, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await razorpay.payments.fetch(paymentId);

        res.json({
            success: true,
            payment: {
                id: payment.id,
                amount: payment.amount / 100, // Convert back to rupees
                currency: payment.currency,
                status: payment.status,
                method: payment.method,
                email: payment.email,
                contact: payment.contact,
                createdAt: payment.created_at
            }
        });
    } catch (error) {
        console.error('Fetch payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment details',
            error: error.message
        });
    }
});

// Webhook endpoint for Razorpay events
router.post('/webhook', async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // Verify webhook signature if secret is configured
        if (secret) {
            const shasum = crypto.createHmac('sha256', secret);
            shasum.update(JSON.stringify(req.body));
            const digest = shasum.digest('hex');

            if (digest !== req.headers['x-razorpay-signature']) {
                return res.status(400).json({ message: 'Invalid signature' });
            }
        }

        const event = req.body.event;
        const paymentEntity = req.body.payload.payment.entity;

        console.log('Razorpay Webhook Event:', event);
        console.log('Payment Entity:', paymentEntity);

        // Handle different webhook events
        switch (event) {
            case 'payment.captured':
                console.log('Payment captured:', paymentEntity.id);
                // Update order status in database
                break;
            case 'payment.failed':
                console.log('Payment failed:', paymentEntity.id);
                // Update order status in database
                break;
            default:
                console.log('Unhandled event:', event);
        }

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
});

module.exports = router;
