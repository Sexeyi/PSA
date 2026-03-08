const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["addition", "issuance", "adjustment"],
        required: true
    },
    quantity: Number,
    unitPrice: Number,
    total: Number,
    reference: String,
    date: {
        type: Date,
        default: Date.now
    }
});

const inventorySchema = new mongoose.Schema({

    itemName: {
        type: String,
        required: true
    },

    category: {
        type: String,
        enum: ["Office Supplies", "Consumables", "COVID-19 Response Item"]
    },

    unit: String,

    stock: {
        type: Number,
        default: 0
    },

    unitPrice: {
        type: Number,
        default: 0
    },

    lowStockThreshold: {
        type: Number,
        default: 10
    },

    transactions: [transactionSchema]

}, { timestamps: true });

module.exports = mongoose.model("Inventory", inventorySchema);