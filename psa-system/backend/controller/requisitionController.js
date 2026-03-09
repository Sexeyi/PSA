// controller/requisitionController.js
const Requisition = require("../models/Requisition");
const Inventory = require("../models/Inventory");
const PDFDocument = require("pdfkit");

// CREATE REQUISITION (REQUESTER)
exports.createRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.create({
            requesterId: req.user._id,      // use _id from auth middleware
            requesterName: req.user.fullName,
            department: req.user.department,
            items: req.body.items,
            notes: req.body.notes,
            status: "Pending",
            dateRequested: new Date()
        });

        res.status(201).json({
            message: "Requisition submitted successfully",
            requisition
        });
    } catch (error) {
        console.error("Error creating requisition:", error);
        res.status(500).json({ message: error.message, errors: error.errors });
    }
};
// GET ALL REQUISITIONS (ADMIN/APPROVER)
exports.getAllRequisitions = async (req, res, next) => {
    try {
        const { status } = req.query;

        let query = {};

        if (status && status !== "all") {
            const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
            query.status = formattedStatus;
        }

        const requisitions = await Requisition.find(query).sort({ dateRequested: -1 });

        res.json({ requests: requisitions });
    } catch (error) {
        console.error("Error in getAllRequisitions:", error);
        next(error);
    }
};

// GET MY REQUISITIONS (REQUESTER)
exports.getMyRequisitions = async (req, res, next) => {
    try {
        const requisitions = await Requisition.find({ requester: req.user._id }).sort({ dateRequested: -1 });
        res.json({ requests: requisitions });
    } catch (error) {
        console.error("Error in getMyRequisitions:", error);
        next(error);
    }
};

// APPROVE REQUISITION
exports.approveRequisition = async (req, res, next) => {
    try {
        const requisition = await Requisition.findById(req.params.id);
        if (!requisition) return res.status(404).json({ message: "Requisition not found" });
        if (requisition.status !== "Pending") return res.status(400).json({ message: "Requisition already processed" });

        // Update inventory
        for (const item of requisition.items) {
            if (!item.itemId) continue; // skip if no inventory link
            const inventoryItem = await Inventory.findById(item.itemId);
            if (!inventoryItem)
                return res.status(400).json({ message: `Inventory item not found` });
            if (inventoryItem.stock < item.quantity)
                return res.status(400).json({ message: `Insufficient stock for ${inventoryItem.itemName}` });

            inventoryItem.stock -= item.quantity;
            inventoryItem.transactions.push({
                type: "issuance",
                quantity: item.quantity,
                reference: requisition._id
            });
            await inventoryItem.save();
        }

        // Update requisition status
        requisition.status = "Approved";
        requisition.approvedDate = req.body.approvedDate || new Date();
        requisition.remarks = req.body.remarks || "";
        await requisition.save();

        res.json({ message: "Requisition approved successfully", requisition });
    } catch (error) {
        console.error("Error in approveRequisition:", error);
        next(error);
    }
};

// REJECT REQUISITION
exports.rejectRequisition = async (req, res, next) => {
    try {
        const requisition = await Requisition.findById(req.params.id);
        if (!requisition) return res.status(404).json({ message: "Requisition not found" });
        if (requisition.status !== "Pending") return res.status(400).json({ message: "Requisition already processed" });

        requisition.status = "Rejected";
        requisition.remarks = req.body.remarks || "";
        await requisition.save();

        res.json({ message: "Requisition rejected", requisition });
    } catch (error) {
        console.error("Error in rejectRequisition:", error);
        next(error);
    }
};

// GENERATE PDF
exports.generatePDF = async (req, res, next) => {
    try {
        const requisition = await Requisition.findById(req.params.id).populate("requester", "fullName department");
        if (!requisition) return res.status(404).json({ message: "Requisition not found" });

        const doc = new PDFDocument();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=requisition.pdf");
        doc.pipe(res);

        doc.fontSize(20).text("REQUISITION FORM", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Requester: ${requisition.requester.fullName}`);
        doc.text(`Department: ${requisition.department}`);
        doc.text(`Date: ${new Date(requisition.dateRequested).toLocaleDateString()}`);
        doc.text(`Status: ${requisition.status}`);
        doc.moveDown();
        doc.fontSize(16).text("Requested Items");
        requisition.items.forEach((item, index) => {
            doc.text(`${index + 1}. ${item.itemName} - Quantity: ${item.quantity}`);
        });
        doc.moveDown();
        doc.text(`Notes: ${requisition.notes || "None"}`);
        doc.end();
    } catch (error) {
        console.error("Error generating PDF:", error);
        next(error);
    }
};