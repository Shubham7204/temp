const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    query: {
        type: String,
        required: true
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
    model_outputs: {
        anomaly_prediction: Number,
        anomaly_score: Number,
        xgb_prediction: Number,
        xgb_probability: Number
    },
    final_decision: {
        approved: {
            type: Boolean,
            default: false
        },
        reason: String,
        status: {
            type: String,
            default: 'Pending'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AccessRequest', accessRequestSchema); 