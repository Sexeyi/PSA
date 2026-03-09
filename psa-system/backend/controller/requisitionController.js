const Requisition = require("../models/Requisition");
const Inventory = require("../models/Inventory");
const PDFDocument = require("pdfkit");


// CREATE REQUISITION
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


// GET ALL REQUISITIONS (ADMIN / APPROVER)
exports.getAllRequisitions = async (req, res) => {
    try {

        const requisitions = await Requisition.find()
            .populate("requester", "fullName department");

        res.json(requisitions);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// GET MY REQUISITIONS (EMPLOYEE)
exports.getMyRequisitions = async (req, res) => {
    try {

        const requisitions = await Requisition.find({
            requester: req.user.id
        });

        res.json(requisitions);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// APPROVE REQUISITION
exports.approveRequisition = async (req, res) => {

    try {

        const requisition = await Requisition.findById(req.params.id);

        if (!requisition)
            return res.status(404).json({ message: "Requisition not found" });

        for (const item of requisition.items) {

            const inventoryItem = await Inventory.findById(item.itemId);

            if (!inventoryItem)
                return res.status(400).json({
                    message: `Inventory item not found`
                });

            if (inventoryItem.stock < item.quantity)
                return res.status(400).json({
                    message: `Insufficient stock for ${inventoryItem.name}`
                });

            // deduct inventory
            inventoryItem.stock -= item.quantity;

            // record issuance
            inventoryItem.transactions.push({
                type: "issuance",
                quantity: item.quantity,
                reference: requisition._id
            });

            await inventoryItem.save();

        }

        requisition.status = "Approved";
        await requisition.save();

        res.json({
            message: "Requisition approved",
            requisition
        });

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};


// REJECT REQUISITION
exports.rejectRequisition = async (req, res) => {

    try {

        const requisition = await Requisition.findById(req.params.id);

        if (!requisition)
            return res.status(404).json({
                message: "Requisition not found"
            });

        requisition.status = "Rejected";

        await requisition.save();

        res.json({
            message: "Requisition rejected",
            requisition
        });

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};


// GENERATE PDF
exports.generatePDF = async (req, res) => {

    try {

        const requisition = await Requisition.findById(req.params.id)
            .populate("requester", "fullName department");

        if (!requisition)
            return res.status(404).json({
                message: "Requisition not found"
            });

        const doc = new PDFDocument();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=requisition.pdf");

        doc.pipe(res);

        doc.fontSize(18).text("REQUISITION FORM", { align: "center" });

        doc.moveDown();

        doc.text(`Requester: ${requisition.requester.fullName}`);
        doc.text(`Department: ${requisition.requester.department}`);
        doc.text(`Date: ${new Date(requisition.date).toLocaleDateString()}`);
        doc.text(`Status: ${requisition.status}`);

        doc.moveDown();

        doc.text("Requested Items:");

        requisition.items.forEach((item, index) => {
            doc.text(
                `${index + 1}. ${item.itemName} - Qty: ${item.quantity}`
            );
        });

        doc.moveDown();

        doc.text(`Notes: ${requisition.notes || "None"}`);

        doc.end();

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};