const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// @route   POST /api/contacts
// @desc    Submit a contact form message
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Basic validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }

        const newContact = new Contact({
            name,
            email,
            phone,
            subject,
            message
        });

        const savedContact = await newContact.save();

        res.status(201).json({
            message: 'Message sent successfully',
            data: savedContact
        });
    } catch (err) {
        console.error('Error saving contact message:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   GET /api/contacts
// @desc    Get all contact messages (Admin only - placeholder for now)
// @access  Private (TODO: Add auth middleware)
router.get('/', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (err) {
        console.error('Error fetching contact messages:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   PUT /api/contacts/:id/status
// @desc    Update contact status
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({ message: 'Message not found' });
        }

        contact.status = status;
        await contact.save();
        res.json(contact);
    } catch (err) {
        console.error('Error updating contact status:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/contacts/:id
// @desc    Delete a contact message
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ message: 'Message not found' });
        }
        await contact.deleteOne();
        res.json({ message: 'Message removed' });
    } catch (err) {
        console.error('Error deleting contact message:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
