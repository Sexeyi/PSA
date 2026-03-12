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

        const doc = new PDFDocument({ 
            size: "A4", 
            margin: 50,
            bufferPages: true
        });
        
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename=Requisition_and_Issue_Slip.pdf`
        );
        doc.pipe(res);

        let y = 50;
        const margin = 50;
        const pageWidth = doc.page.width - 100;

        // ==================== HEADER ====================
        doc.fontSize(10).font("Helvetica")
           .text("Appendix 63", margin, y);
        y += 20;

        // Title
        doc.fontSize(14).font("Helvetica-Bold")
           .text("REQUISITION AND ISSUE SLIP", margin, y, {
               align: "center",
               width: pageWidth
           });
        y += 25;

        // Entity Name and Fund Cluster
        doc.fontSize(9).font("Helvetica");
        doc.text("Entity Name :", margin, y);
        doc.font("Helvetica-Bold")
           .text("PHILIPPINE STATISTICS AUTHORITY-Ilocos Sur Provincial Statistical Office", 
                 margin + 60, y, { width: 350 });
        
        doc.font("Helvetica")
           .text("Fund Cluster :", margin + 420, y);
        doc.font("Helvetica-Bold")
           .text("General Fund", margin + 490, y);
        
        y += 20;

        // ==================== MAIN TABLE ====================
        // Column widths for the entire table
        const col1Width = 150; // Division/Office column (first column)
        const col2Width = 150; // Responsibility Center Code/RIS No. column (second column)
        const col3Width = 160; // Requisition section (starts from the beginning of row 2)
        const col4Width = 70;  // Stock Available? section
        const col5Width = 110; // Issue section
        
        // Sub-column widths for the data section
        const stockNoWidth = 45;
        const unitWidth = 40;
        const descWidth = 75;
        const qtyWidth = 40;
        const stockYesWidth = 35;
        const stockNoCheckWidth = 35;
        const issueQtyWidth = 45;
        const remarksWidth = 65;
        
        let x = margin;
        
        // ==================== ROW 1: Division | Responsibility Center Code ====================
        doc.lineWidth(0.5);
        
        // Row 1 height (for two lines of text)
        const row1Height = 40;
        
        // Draw ONLY the two cells for row 1
        doc.rect(x, y, col1Width, row1Height).stroke();
        doc.rect(x + col1Width, y, col2Width, row1Height).stroke();
        
        // First line of row 1
        doc.font("Helvetica-Bold").fontSize(8);
        doc.text("Division :", x + 5, y + 5);
        doc.text("Responsibility Center Code :", x + col1Width + 5, y + 5);
        
        // Second line of row 1 (move down 20px)
        y += 20;
        
        doc.font("Helvetica-Bold").fontSize(8);
        doc.text("Office :", x + 5, y);
        doc.font("Helvetica").fontSize(8)
           .text(requisition.requesterId?.department || "Civil Registration Unit", 
                 x + 40, y, { width: 100 });
        
        doc.font("Helvetica-Bold").fontSize(8)
           .text("RIS No. :", x + col1Width + 5, y);
        doc.font("Helvetica-Bold").fontSize(8)
           .text(requisition._id.toString().slice(-8), x + col1Width + 45, y);
        
        // Move y to bottom of row 1
        y += 20;
        
        // ==================== ROW 2: Requisition | Stock Available? | Issue ====================
        // Reset x to the very beginning (margin) for row 2
        x = margin;
        
        // Draw the three cells for row 2 - starting from the very left
        doc.rect(x, y, col3Width, 25).stroke();
        doc.rect(x + col3Width, y, col4Width, 25).stroke();
        doc.rect(x + col3Width + col4Width, y, col5Width, 25).stroke();
        
        // Row 2 text
        doc.font("Helvetica-Bold").fontSize(9);
        doc.text("REQUISITION", x + 40, y + 7);
        
        doc.font("Helvetica-Bold").fontSize(8);
        doc.text("Stock", x + col3Width + 15, y + 5);
        doc.text("Available?", x + col3Width + 15, y + 15);
        
        doc.font("Helvetica-Bold").fontSize(9);
        doc.text("ISSUE", x + col3Width + col4Width + 35, y + 7);
        
        y += 25;
        
        // ==================== ROW 3: Column Headers ====================
        x = margin; // Start from the very beginning again
        
        // Draw all column headers
        doc.rect(x, y, stockNoWidth, 20).stroke();
        doc.rect(x + stockNoWidth, y, unitWidth, 20).stroke();
        doc.rect(x + stockNoWidth + unitWidth, y, descWidth, 20).stroke();
        doc.rect(x + stockNoWidth + unitWidth + descWidth, y, qtyWidth, 20).stroke();
        doc.rect(x + stockNoWidth + unitWidth + descWidth + qtyWidth, y, stockYesWidth, 20).stroke();
        doc.rect(x + stockNoWidth + unitWidth + descWidth + qtyWidth + stockYesWidth, y, stockNoCheckWidth, 20).stroke();
        doc.rect(x + stockNoWidth + unitWidth + descWidth + qtyWidth + stockYesWidth + stockNoCheckWidth, y, issueQtyWidth, 20).stroke();
        doc.rect(x + stockNoWidth + unitWidth + descWidth + qtyWidth + stockYesWidth + stockNoCheckWidth + issueQtyWidth, y, remarksWidth, 20).stroke();
        
        // Header text
        doc.font("Helvetica-Bold").fontSize(8);
        doc.text("Stock No.", x + 8, y + 5);
        doc.text("Unit", x + stockNoWidth + 10, y + 5);
        doc.text("Description", x + stockNoWidth + unitWidth + 8, y + 5);
        doc.text("Quantity", x + stockNoWidth + unitWidth + descWidth + 8, y + 5);
        // No text for the checkbox columns
        doc.text("Quantity", x + stockNoWidth + unitWidth + descWidth + qtyWidth + stockYesWidth + stockNoCheckWidth + 8, y + 5);
        doc.text("Remarks", x + stockNoWidth + unitWidth + descWidth + qtyWidth + stockYesWidth + stockNoCheckWidth + issueQtyWidth + 10, y + 5);
        
        y += 20;
        
        // ==================== DATA ROWS (10 rows) ====================
        const rowHeight = 18;
        
        // Create sample data based on your PDF
        const sampleItems = [
            { unit: "pc", description: "JOYARN", quantity: 1 },
            { unit: "pc", description: "JOYARN", quantity: 1 },
            { unit: "pc", description: "JOYARN", quantity: 1 },
            { unit: "pc", description: "JOYARN", quantity: 1 },
            { unit: "pc", description: "JOYARN", quantity: 1 },
            { unit: "pc", description: "JOYARN", quantity: 1 },
            { unit: "pc", description: "JOYARN", quantity: 1 },
            { unit: "pc", description: "JOYARN", quantity: 1 },
            { unit: "pc", description: "JOYARN", quantity: 1 },
            { unit: "pc", description: "JOYARN", quantity: 1 }
        ];
        
        // Use requisition items if available, otherwise use sample data
        const itemsToUse = requisition.items.length > 0 ? requisition.items : sampleItems;
        
        // Prepare rows data
        const rows = [];
        
        // Add items (up to 10)
        itemsToUse.forEach((item, index) => {
            if (index < 10) {
                rows.push({
                    stockNo: index + 1,
                    unit: item.unit || "pc",
                    description: item.itemName || item.description || "JOYARN",
                    quantity: item.quantity || 1,
                    remarks: item.remarks || ""
                });
            }
        });
        
        // Fill remaining rows with empty data
        for (let i = rows.length; i < 10; i++) {
            rows.push({
                stockNo: i + 1,
                unit: "",
                description: "",
                quantity: "",
                remarks: ""
            });
        }
        
        // Draw each row
        rows.forEach((row, index) => {
            x = margin; // Start from the very beginning for each row
            
            // Stock No.
            doc.rect(x, y, stockNoWidth, rowHeight).stroke();
            doc.font("Helvetica").fontSize(8)
               .text(String(row.stockNo), x + 15, y + 5);
            x += stockNoWidth;
            
            // Unit
            doc.rect(x, y, unitWidth, rowHeight).stroke();
            doc.text(row.unit, x + 12, y + 5);
            x += unitWidth;
            
            // Description
            doc.rect(x, y, descWidth, rowHeight).stroke();
            doc.text(row.description, x + 8, y + 5, { width: descWidth - 10 });
            x += descWidth;
            
            // Quantity
            doc.rect(x, y, qtyWidth, rowHeight).stroke();
            doc.text(String(row.quantity), x + 12, y + 5);
            x += qtyWidth;
            
            // Stock Available? Yes checkbox
            doc.rect(x, y, stockYesWidth, rowHeight).stroke();
            doc.rect(x + 10, y + 4, 10, 10).stroke();
            x += stockYesWidth;
            
            // Stock Available? No checkbox
            doc.rect(x, y, stockNoCheckWidth, rowHeight).stroke();
            doc.rect(x + 10, y + 4, 10, 10).stroke();
            x += stockNoCheckWidth;
            
            // Issue Quantity (empty)
            doc.rect(x, y, issueQtyWidth, rowHeight).stroke();
            x += issueQtyWidth;
            
            // Remarks
            doc.rect(x, y, remarksWidth, rowHeight).stroke();
            doc.text(row.remarks, x + 8, y + 5, { width: remarksWidth - 10 });
            
            y += rowHeight;
        });
        
        y += 10;
        
        // ==================== SIGNATURE TABLE ====================
        const sigWidth = 140;
        
        x = margin;
        
        // Signature header row
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.font("Helvetica-Bold").fontSize(8).text("Signature :", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("Requested by:", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("Approved by:", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("Issued by:", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("Received by:", x + 5, y + 5);
        
        y += 20;
        
        // Printed Name row
        x = margin;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.font("Helvetica").text("Printed Name :", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text(requisition.requesterId?.fullName || "Employee", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("_____________________", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("_____________________", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("_____________________", x + 5, y + 5);
        
        y += 20;
        
        // Designation row
        x = margin;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("Designation :", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("_____________________", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("_____________________", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("_____________________", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("_____________________", x + 5, y + 5);
        
        y += 20;
        
        // Date row
        x = margin;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("Date :", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("3/12/2026", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("_____________________", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("_____________________", x + 5, y + 5);
        
        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text("_____________________", x + 5, y + 5);

        doc.end();
        
    } catch (err) {
        console.error("PDF generation error:", err);
        res.status(500).json({ message: err.message });
    }
};