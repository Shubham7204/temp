const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    query: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied'],
        default: 'pending'
    },
    mlDecision: {
        final_decision: {
            approved: Boolean,
            reason: String,
            status: String
        },
        inferred_data: {
            request_reason: String,
            resource_sensitivity: String,
            resource_type: String
        },
        model_outputs: {
            anomaly_prediction: Number,
            anomaly_score: Number,
            xgb_prediction: Number,
            xgb_probability: Number
        }
    },
    request_details: {
        department: String,
        employee_join_date: String,
        employee_status: String,
        last_security_training: String,
        past_violations: Number,
        request_reason: String,
        resource_sensitivity: String,
        resource_type: String,
        time_in_position: String,
        user_role: String
    },
    adminNotes: String,
    reviewedBy: String,
    reviewedAt: Date
});

module.exports = mongoose.model('Ticket', ticketSchema); 