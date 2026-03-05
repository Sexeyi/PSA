const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
    itemName: {
        type: String,
        unique: true,
        required: true
    },
    category: String,
    stock: {
        type: Number,
        required: true,
        min: 0
    }
});

module.exports = mongoose.model("Inventory", inventorySchema);