const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    unit: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        default: ""
    },
    unitPrice: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        default: 0
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory'
    }
});

const RequisitionSchema = new mongoose.Schema({
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requesterName: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    items: [ItemSchema],
    notes: { type: String, default: "" },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'issued'],
        default: 'pending'
    },
    dateRequested: {
        type: Date,
        default: Date.now
    },
    approvedDate: {
        type: Date
    },
    remarks: {
        type: String,
        default: ""
    },
    approvedBy: {
        type: String,
        default: ""
    },
    approverRemarks: {
        type: String,
        default: ""
    },
    overallTotal: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Requisition', RequisitionSchema);