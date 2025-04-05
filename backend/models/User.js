const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    employee_join_date: {
        type: Date,
        required: true
    },
    employee_status: {
        type: String,
        required: true
    },
    last_security_training: {
        type: String,
        default: "Never"
    },
    past_violations: {
        type: Number,
        default: 0
    },
    resource_sensitivity: {
        type: String,
        default: ""
    },
    time_in_position: {
        type: String,
        required: true
    },
    user_role: {
        type: String,
        required: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('User', userSchema);