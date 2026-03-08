const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory"
    },
    itemName: String,
    description: String,
    category: String,
    quantity: Number
});

const requisitionSchema = new mongoose.Schema({

    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    department: String,

    date: {
        type: Date,
        default: Date.now
    },

    items: [itemSchema],

    notes: String,

    status: {
        type: String,
        enum: ["Pending Approver", "Pending Admin", "Approved", "Rejected"],
        default: "Pending Approver"
    }

}, { timestamps: true });

module.exports = mongoose.model("Requisition", requisitionSchema);