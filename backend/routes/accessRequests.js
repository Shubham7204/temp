const express = require('express');
const router = express.Router();
const { Pinecone } = require("@pinecone-database/pinecone");
const AccessRequest = require('../models/AccessRequest');

// Initialize Pinecone client
const pinecone = new Pinecone({ 
    apiKey: process.env.PINECONE_API_KEY
});

// Get all access requests
router.get('/access-requests', async (req, res) => {
    try {
        // TODO: Replace with your database query
        const accessRequests = await AccessRequest.find().sort({ createdAt: -1 });
        res.json(accessRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Approve an access request
router.post('/access-requests/:id/approve', async (req, res) => {
    try {
        const request = await AccessRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.final_decision.approved = true;
        request.final_decision.status = 'Approved';
        await request.save();

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add document to knowledge base (Pinecone)
router.post('/knowledge-base/:id', async (req, res) => {
    try {
        const request = await AccessRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const index = pinecone.index('your-index-name'); // Replace with your index name

        // Create vector embedding from the request data
        // Note: You'll need to implement the actual embedding generation based on your ML model
        const vector = {
            id: request._id.toString(),
            values: new Array(1536).fill(0), // Temporary placeholder vector
            metadata: {
                query: request.query,
                department: request.request_details.department,
                resourceType: request.request_details.resource_type,
                resourceSensitivity: request.request_details.resource_sensitivity,
            }
        };

        // Upsert the vector to Pinecone
        await index.upsert([vector]);

        res.json({ message: 'Successfully added to knowledge base' });
    } catch (error) {
        console.error('Error adding to knowledge base:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 