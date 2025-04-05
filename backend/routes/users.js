const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get current user (for testing, we'll return the hardcoded user)
router.get('/current', async (req, res) => {
    try {
        // For now, return the hardcoded user
        // In a real application, this would use authentication to get the current user
        const user = await User.findOne({ email: 'shubhammourya@gmail.com' });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user by email
router.get('/by-email/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 