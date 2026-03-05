const mongoose = require("mongoose");

const requisitionSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    department: {
        type: String,
        required: true,
    },

    date: {
        type: Date,
        required: true,
    },

    items: [
        {
            category: {
                type: String,
                enum: ["Office Supplies", "Consumables", "COVID-19 Response Item"],
                required: true,
            },
            itemName: {
                type: String,
                required: true,
            },
            description: String,
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
        },
    ],

    notes: String,

    status: {
        type: String,
        enum: [
            "Pending Approver",
            "Pending Admin",
            "Approved",
            "Rejected"
        ],
        default: "Pending Approver",
    },

    approvalHistory: [
        {
            approvedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            role: String,
            action: String, // Approved or Rejected
            remarks: String,
            date: { type: Date, default: Date.now }
        }
    ]

}, { timestamps: true });

module.exports = mongoose.model("Requisition", requisitionSchema);