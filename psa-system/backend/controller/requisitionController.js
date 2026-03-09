// controller/requisitionController.js
const Requisition = require("../models/Requisition");
const Inventory = require("../models/Inventory");
const PDFDocument = require("pdfkit");

// ------------------------- CREATE REQUISITION -------------------------
exports.createRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.create({
            requesterId: req.user._id,
            requesterName: req.user.fullName,
            department: req.user.department,
            items: req.body.items,
            notes: req.body.notes
        });

        res.status(201).json({
            message: "Requisition submitted successfully",
            requisition
        });
    } catch (error) {
        console.error("Error creating requisition:", error);
        res.status(500).json({ message: error.message });
    }
};

// ------------------------- GET ALL REQUISITIONS -------------------------
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

// ------------------------- GET MY REQUISITIONS -------------------------
exports.getMyRequisitions = async (req, res) => {
    try {
        const requisitions = await Requisition.find({ requesterId: req.user._id }).sort({ dateRequested: -1 });
        res.json(requisitions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------------- APPROVE REQUISITION -------------------------
exports.approveRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id);
        if (!requisition) return res.status(404).json({ message: "Requisition not found" });
        if (requisition.status !== "Pending") return res.status(400).json({ message: "Already processed" });

        // Deduct inventory
        for (const item of requisition.items) {
            if (!item.itemId) continue;
            const inventoryItem = await Inventory.findById(item.itemId);
            if (!inventoryItem) return res.status(400).json({ message: `Inventory item not found: ${item.itemName}` });
            if (inventoryItem.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${inventoryItem.itemName}` });

            inventoryItem.stock -= item.quantity;
            inventoryItem.transactions.push({ type: "issuance", quantity: item.quantity, reference: requisition._id });
            await inventoryItem.save();
        }

        requisition.status = "Approved";
        requisition.approvedDate = new Date();
        requisition.approverRemarks = req.body.remarks || "";
        requisition.approvedBy = req.user.fullName;

        await requisition.save();

        res.json({ message: "Requisition approved successfully", requisition });
    } catch (error) {
        console.error("Approve error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ------------------------- REJECT REQUISITION -------------------------
exports.rejectRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id);
        if (!requisition) return res.status(404).json({ message: "Requisition not found" });
        if (requisition.status !== "Pending") return res.status(400).json({ message: "Already processed" });

        requisition.status = "Rejected";
        requisition.approverRemarks = req.body.remarks || "";
        requisition.approvedDate = new Date();
        requisition.approvedBy = req.user.fullName;

        await requisition.save();

        res.json({ message: "Requisition rejected", requisition });
    } catch (error) {
        console.error("Reject error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ------------------------- GENERATE PDF -------------------------
exports.generatePDF = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id)
            .populate("requesterId", "fullName department");

        if (!requisition)
            return res.status(404).json({ message: "Requisition not found" });

        const doc = new PDFDocument({ size: "A4", margin: 40 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename=requisition_${requisition._id}.pdf`
        );
        doc.pipe(res);

        // --- Title ---
        doc.fontSize(16).text("REQUISITION AND ISSUE SLIP", { align: "center" });
        doc.moveDown(1);

        // --- Header Info ---
        doc.fontSize(10);
        doc.text(`Office: ${requisition.requesterId.department}`, { continued: true });
        doc.text(`  RIS No.: ${requisition._id}`, { align: "right" });
        doc.moveDown(0.5);
        doc.text(`Entity Name: PHILIPPINE STATISTICS AUTHORITY`, { continued: true });
        doc.text(`  Fund Cluster: General Fund`, { align: "right" });
        doc.moveDown(0.5);
        doc.text(`Division: ${requisition.requesterId.department}`);
        doc.text(`Purpose: ${requisition.notes || "N/A"}`);
        doc.moveDown(1);

        // --- Table Columns ---
        const tableTop = doc.y + 5;
        const startX = 40;
        const colWidths = [50, 180, 50, 80, 80, 80]; // Stock No., Desc, Unit, Qty Req, Qty Issued, Remarks
        const colsX = [];
        let x = startX;
        colWidths.forEach(w => { colsX.push(x); x += w; });

        // Draw table header
        doc.font("Helvetica-Bold").fontSize(10);
        const headers = ["Stock No.", "Description", "Unit", "Quantity Requested", "Quantity Issued", "Remarks"];
        headers.forEach((header, i) => {
            doc.text(header, colsX[i] + 2, tableTop, { width: colWidths[i] - 4, align: "center" });
        });

        // Draw horizontal line under header
        doc.moveTo(startX, tableTop + 15).lineTo(x, tableTop + 15).stroke();

        // Draw vertical lines for header
        colsX.forEach(cx => doc.moveTo(cx, tableTop).lineTo(cx, tableTop + 15 + (requisition.items.length * 20)).stroke());
        doc.moveTo(x, tableTop).lineTo(x, tableTop + 15 + (requisition.items.length * 20)).stroke();

        // --- Table Rows ---
        doc.font("Helvetica").fontSize(10);
        let y = tableTop + 15;

        requisition.items.forEach((item, index) => {
            const rowHeight = 20;

            // Fill row text
            const rowValues = [
                index + 1,
                item.itemName,
                item.unit || "-",
                item.quantity,
                "", // Quantity Issued blank
                ""  // Remarks blank
            ];

            rowValues.forEach((val, i) => {
                doc.text(val, colsX[i] + 2, y + 5, { width: colWidths[i] - 4, align: "center" });
            });

            // Draw horizontal line at bottom of row
            doc.moveTo(startX, y + rowHeight).lineTo(x, y + rowHeight).stroke();

            y += rowHeight;
        });

        // Draw vertical lines for all rows
        colsX.forEach(cx => doc.moveTo(cx, tableTop).lineTo(cx, y).stroke());
        doc.moveTo(x, tableTop).lineTo(x, y).stroke();

        doc.moveDown(2);

        // --- Footer Signatures ---
        const footerY = y + 20;
        const sigWidth = 150;
        const sigGap = 50;
        const signatures = ["Prepared by:", "Noted by:", "Approved by:"];

        signatures.forEach((label, i) => {
            const sigX = startX + i * (sigWidth + sigGap);
            doc.text(label, sigX, footerY, { width: sigWidth, align: "center" });
            doc.moveDown(2);
            doc.text("(Signature over Printed Name)", sigX, doc.y, { width: sigWidth, align: "center" });
            doc.moveDown(1);
            doc.text("Position", sigX, doc.y, { width: sigWidth, align: "center" });
        });

        doc.end();
    } catch (err) {
        console.error("PDF generation error:", err);
        res.status(500).json({ message: err.message });
    }
};