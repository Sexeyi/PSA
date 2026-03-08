const Requisition = require("../models/Requisition");
const Inventory = require("../models/Inventory");

exports.createRequisition = async (req, res) => {

    try {

        const requisition = await Requisition.create({
            requester: req.user.id,
            department: req.user.department,
            items: req.body.items,
            notes: req.body.notes
        });

        res.status(201).json(requisition);

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};

exports.approveRequisition = async (req, res) => {

    try {

        const requisition = await Requisition.findById(req.params.id);

        if (!requisition)
            return res.status(404).json({ message: "Requisition not found" });

        for (const item of requisition.items) {

            const inventoryItem = await Inventory.findById(item.itemId);

            if (!inventoryItem)
                return res.status(400).json({ message: "Inventory item not found" });

            if (inventoryItem.stock < item.quantity)
                return res.status(400).json({
                    message: `Insufficient stock for ${inventoryItem.itemName}`
                });

            inventoryItem.stock -= item.quantity;

            inventoryItem.transactions.push({
                type: "issuance",
                quantity: item.quantity,
                reference: requisition._id
            });

            await inventoryItem.save();

        }

        requisition.status = "Approved";

        await requisition.save();

        res.json({ message: "Requisition approved", requisition });

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};