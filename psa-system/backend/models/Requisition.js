const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory"
    },
    itemName: String,
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
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    }

}, { timestamps: true });

module.exports = mongoose.model("Requisition", requisitionSchema);