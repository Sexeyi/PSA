const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["addition", "issuance", "adjustment"]
    },
    quantity: Number,
    reference: String,
    date: {
        type: Date,
        default: Date.now
    }
});

const inventorySchema = new mongoose.Schema({
    name: String,
    category: String,
    unit: String,
    stock: {
        type: Number,
        default: 0
    },
    unitPrice: {
        type: Number,
        default: 0
    },
    // Add these nested fields to match frontend
    inventoryDec31: {
        qty: { type: Number, default: 0 },
        unitPrice: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    additions: {
        qty: { type: Number, default: 0 },
        unitPrice: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    issuances: {
        qty: { type: Number, default: 0 },
        unitPrice: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    balances: {
        qty: { type: Number, default: 0 },
        unitPrice: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    transactions: [transactionSchema]
});

module.exports = mongoose.model("Inventory", inventorySchema);