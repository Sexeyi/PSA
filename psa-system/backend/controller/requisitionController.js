const Requisition = require('../models/Requisition');
const Inventory = require('../models/Inventory');

exports.createRequisition = async (req, res) => {
    try {
        const { date, items, notes } = req.body;

        const requisition = await Requisition.create({
            requester: req.user._id,
            department: req.user.department,
            date,
            items,
            notes
        });

        res.status(201).json(requisition);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.approveRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id);

        if (!requisition) {
            return res.status(404).json({ message: "Requisition not found" });
        }

        const role = req.user.role;

        // Approver stage
        if (requisition.status === "Pending Approver" && role === "Approver") {
            requisition.status = "Pending Admin";
        }

        // Admin stage
        else if (requisition.status === "Pending Admin" && role === "Admin") {

            // Deduct inventory BEFORE final approval
            for (const item of requisition.items) {
                const inventoryItem = await Inventory.findOne({ itemName: item.itemName });

                if (!inventoryItem || inventoryItem.stock < item.quantity) {
                    return res.status(400).json({
                        message: `Insufficient stock for ${item.itemName}`
                    });
                }

                inventoryItem.stock -= item.quantity;
                await inventoryItem.save();
            }

            requisition.status = "Approved";
        }

        else {
            return res.status(403).json({ message: "Not authorized for this action" });
        }

        requisition.approvalHistory.push({
            approvedBy: req.user._id,
            role: role,
            action: "Approved"
        });

        await requisition.save();

        res.json(requisition);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.rejectRequisition = async (req, res) => {
    try {
        const { remarks } = req.body;

        const requisition = await Requisition.findById(req.params.id);

        requisition.status = "Rejected";

        requisition.approvalHistory.push({
            approvedBy: req.user._id,
            role: req.user.role,
            action: "Rejected",
            remarks
        });

        await requisition.save();

        res.json(requisition);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};