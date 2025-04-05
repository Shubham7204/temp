const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// Get all tickets
router.get('/tickets', async (req, res) => {
    try {
        const tickets = await Ticket.find().sort({ timestamp: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single ticket
router.get('/tickets/:id', async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new ticket
router.post('/tickets', async (req, res) => {
    const ticket = new Ticket({
        username: req.body.username,
        query: req.body.query,
        mlDecision: req.body.mlDecision,
        request_details: req.body.request_details
    });

    try {
        const newTicket = await ticket.save();
        res.status(201).json(newTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a ticket
router.patch('/tickets/:id', async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (req.body.status) {
            ticket.status = req.body.status;
        }
        if (req.body.adminNotes) {
            ticket.adminNotes = req.body.adminNotes;
        }
        if (req.body.reviewedBy) {
            ticket.reviewedBy = req.body.reviewedBy;
            ticket.reviewedAt = new Date();
        }

        const updatedTicket = await ticket.save();
        res.json(updatedTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 