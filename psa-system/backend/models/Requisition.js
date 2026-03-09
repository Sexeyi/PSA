const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: "" },
    category: { type: String, default: "" },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }
});

const RequisitionSchema = new mongoose.Schema({
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requesterName: { type: String, required: true },
    department: { type: String, required: true },
    items: [ItemSchema],
    notes: { type: String, default: "" },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    dateRequested: { type: Date, default: Date.now },
    approvedDate: { type: Date },
    remarks: { type: String, default: "" },
    approvedBy: { type: String, default: "" },
    approverRemarks: { type: String, default: "" },
});

module.exports = mongoose.model('Requisition', RequisitionSchema);