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
            // Handle case-insensitive status matching
            const statusMap = {
                'pending': 'Pending',
                'approved': 'Approved',
                'rejected': 'Rejected',
                'issued': 'Issued'
            };

            const formattedStatus = statusMap[status.toLowerCase()] ||
                (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase());
            query.status = formattedStatus;
        }

        const requisitions = await Requisition.find(query)
            .populate('requesterId', 'fullName email department')
            .sort({ dateRequested: -1 });

        res.json({
            success: true,
            count: requisitions.length,
            data: requisitions
        });
    } catch (error) {
        console.error("Error in getAllRequisitions:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ------------------------- GET SINGLE REQUISITION -------------------------
exports.getRequisitionById = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id)
            .populate('requesterId', 'fullName email department employeeId');

        if (!requisition) {
            return res.status(404).json({
                success: false,
                message: "Requisition not found"
            });
        }

        res.json({
            success: true,
            data: requisition
        });
    } catch (error) {
        console.error("Error fetching requisition:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ------------------------- GET MY REQUISITIONS -------------------------
exports.getMyRequisitions = async (req, res) => {
    try {
        const requisitions = await Requisition.find({ requesterId: req.user._id })
            .sort({ dateRequested: -1 });

        res.json({
            success: true,
            data: requisitions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ------------------------- APPROVE REQUISITION -------------------------
exports.approveRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id);

        if (!requisition) {
            return res.status(404).json({
                success: false,
                message: "Requisition not found"
            });
        }

        // Check if requisition is still pending
        if (requisition.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Requisition already ${requisition.status}`
            });
        }

        // Check if user has permission (SuperAdmin or Admin)
        const userRole = req.user.role?.toLowerCase();
        if (userRole !== 'superadmin' && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to approve requisitions"
            });
        }

        // Deduct inventory only if user is Admin (for issuance)
        // For SuperAdmin, just approve without deducting inventory
        if (userRole === 'admin') {
            for (const item of requisition.items) {
                // Try to find inventory item by name if itemId is not provided
                let inventoryItem;

                if (item.itemId) {
                    inventoryItem = await Inventory.findById(item.itemId);
                } else {
                    // Try to find by item name (case-insensitive)
                    inventoryItem = await Inventory.findOne({
                        name: { $regex: new RegExp(item.itemName, 'i') }
                    });
                }

                if (!inventoryItem) {
                    return res.status(400).json({
                        success: false,
                        message: `Inventory item not found: ${item.itemName}`
                    });
                }

                if (inventoryItem.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.stock}, Requested: ${item.quantity}`
                    });
                }

                // Deduct from inventory
                inventoryItem.stock -= item.quantity;

                // Add transaction record
                if (!inventoryItem.transactions) {
                    inventoryItem.transactions = [];
                }

                inventoryItem.transactions.push({
                    type: "issuance",
                    quantity: item.quantity,
                    reference: requisition._id,
                    date: new Date()
                });

                await inventoryItem.save();
            }
        }

        // Update requisition status
        requisition.status = userRole === 'admin' ? "Issued" : "Approved";
        requisition.approvedDate = new Date();
        requisition.approverRemarks = req.body.remarks || "";
        requisition.approvedBy = req.user.fullName;

        await requisition.save();

        res.json({
            success: true,
            message: `Requisition ${requisition.status.toLowerCase()} successfully`,
            data: requisition
        });

    } catch (error) {
        console.error("Approve error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ------------------------- ISSUE REQUISITION -------------------------
exports.issueRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id);

        if (!requisition) {
            return res.status(404).json({
                success: false,
                message: "Requisition not found"
            });
        }

        // Check if user is Admin
        const userRole = req.user.role?.toLowerCase();
        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Only Admin can issue requisitions"
            });
        }

        // Check if requisition is approved by SuperAdmin
        if (requisition.status !== "Approved") {
            return res.status(400).json({
                success: false,
                message: `Requisition must be approved first. Current status: ${requisition.status}`
            });
        }

        // Deduct inventory for each item
        for (const item of requisition.items) {
            // Try to find inventory item by name if itemId is not provided
            let inventoryItem;

            if (item.itemId) {
                inventoryItem = await Inventory.findById(item.itemId);
            } else {
                // Try to find by item name (case-insensitive)
                inventoryItem = await Inventory.findOne({
                    name: { $regex: new RegExp(item.itemName, 'i') }
                });
            }

            if (!inventoryItem) {
                return res.status(400).json({
                    success: false,
                    message: `Inventory item not found: ${item.itemName}`
                });
            }

            if (inventoryItem.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.stock}, Requested: ${item.quantity}`
                });
            }

            // Deduct from inventory
            inventoryItem.stock -= item.quantity;

            // Add transaction record
            if (!inventoryItem.transactions) {
                inventoryItem.transactions = [];
            }

            inventoryItem.transactions.push({
                type: "issuance",
                quantity: item.quantity,
                reference: requisition._id,
                date: new Date()
            });

            await inventoryItem.save();
        }

        // Update requisition status
        requisition.status = "Issued";
        requisition.approvedDate = new Date();
        requisition.approverRemarks = req.body.remarks || "";
        requisition.approvedBy = req.user.fullName;

        await requisition.save();

        res.json({
            success: true,
            message: "Requisition issued successfully",
            data: requisition
        });

    } catch (error) {
        console.error("Issue error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ------------------------- REJECT REQUISITION -------------------------
exports.rejectRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id);

        if (!requisition) {
            return res.status(404).json({
                success: false,
                message: "Requisition not found"
            });
        }

        // Check if requisition is still pending
        if (requisition.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Requisition already ${requisition.status}`
            });
        }

        // Check if user has permission (SuperAdmin or Admin)
        const userRole = req.user.role?.toLowerCase();
        if (userRole !== 'superadmin' && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to reject requisitions"
            });
        }

        requisition.status = "Rejected";
        requisition.approverRemarks = req.body.remarks || "";
        requisition.approvedDate = new Date();
        requisition.approvedBy = req.user.fullName;

        await requisition.save();

        res.json({
            success: true,
            message: "Requisition rejected successfully",
            data: requisition
        });

    } catch (error) {
        console.error("Reject error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ------------------------- UPDATE REQUISITION -------------------------
exports.updateRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id);

        if (!requisition) {
            return res.status(404).json({
                success: false,
                message: "Requisition not found"
            });
        }

        // Only allow updates if status is pending
        if (requisition.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Cannot update requisition with status: ${requisition.status}`
            });
        }

        // Update fields
        const { items, notes } = req.body;

        if (items) requisition.items = items;
        if (notes !== undefined) requisition.notes = notes;

        await requisition.save();

        res.json({
            success: true,
            message: "Requisition updated successfully",
            data: requisition
        });

    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ------------------------- DELETE REQUISITION -------------------------
exports.deleteRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id);

        if (!requisition) {
            return res.status(404).json({
                success: false,
                message: "Requisition not found"
            });
        }

        // Only allow deletion if status is pending
        if (requisition.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Cannot delete requisition with status: ${requisition.status}`
            });
        }

        await Requisition.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Requisition deleted successfully"
        });

    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
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
            `inline; filename=Requisition_${requisition._id}.pdf`
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
            .text(requisition.requesterId?.department || requisition.department || "Civil Registration Unit",
                x + 40, y, { width: 100 });

        doc.font("Helvetica-Bold").fontSize(8)
            .text("RIS No. :", x + col1Width + 5, y);
        doc.font("Helvetica-Bold").fontSize(8)
            .text(requisition._id.toString().slice(-8).toUpperCase(), x + col1Width + 45, y);

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

        // Prepare rows data from requisition items
        const rows = [];

        // Add requisition items (up to 10)
        if (requisition.items && requisition.items.length > 0) {
            requisition.items.forEach((item, index) => {
                if (index < 10) {
                    rows.push({
                        stockNo: index + 1,
                        unit: item.unit || "pc",
                        description: item.itemName || item.description || "Item",
                        quantity: item.quantity || 1,
                        remarks: ""
                    });
                }
            });
        }

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
            if (row.quantity) {
                // Check if stock is available (you can add logic here)
                doc.text("✓", x + 12, y + 2);
            }
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
        doc.text(requisition.requesterName || "Employee", x + 5, y + 5);

        x += sigWidth;
        doc.rect(x, y, sigWidth, 20).stroke();
        doc.text(requisition.approvedBy || "_____________________", x + 5, y + 5);

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
        doc.text(requisition.department || "_____________________", x + 5, y + 5);

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

        // Format date
        const dateStr = requisition.dateRequested
            ? new Date(requisition.dateRequested).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '/')
            : new Date().toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '/');

        doc.text(dateStr, x + 5, y + 5);

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

// ------------------------- UPDATE REQUISITION STATUS -------------------------
exports.updateRequisitionStatus = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const requisition = await Requisition.findById(req.params.id);

        if (!requisition) {
            return res.status(404).json({
                success: false,
                message: "Requisition not found"
            });
        }

        // Validate status
        const validStatuses = ['Pending', 'Approved', 'Rejected', 'Issued'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        requisition.status = status;
        requisition.approverRemarks = remarks || requisition.approverRemarks;
        requisition.approvedDate = new Date();
        requisition.approvedBy = req.user.fullName;

        await requisition.save();

        res.json({
            success: true,
            message: `Requisition status updated to ${status}`,
            data: requisition
        });

    } catch (error) {
        console.error("Status update error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};