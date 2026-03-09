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

    unitPrice: Number,

    transactions: [transactionSchema]

});

module.exports = mongoose.model("Inventory", inventorySchema);