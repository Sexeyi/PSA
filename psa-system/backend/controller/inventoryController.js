const Inventory = require("../models/Inventory");

exports.getInventory = async (req, res) => {

    try {

        const items = await Inventory.find().sort({ itemName: 1 });

        res.json(items);

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};

exports.createItem = async (req, res) => {

    try {

        const item = await Inventory.create(req.body);

        res.status(201).json(item);

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};

exports.updateItem = async (req, res) => {

    try {

        const item = await Inventory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(item);

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};

exports.deleteItem = async (req, res) => {

    try {

        await Inventory.findByIdAndDelete(req.params.id);

        res.json({ message: "Item deleted" });

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};