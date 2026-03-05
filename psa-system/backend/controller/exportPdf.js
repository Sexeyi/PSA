const PDFDocument = require("pdfkit");

exports.generatePDF = async (req, res) => {
    const requisition = await Requisition.findById(req.params.id)
        .populate("requester", "fullName department");

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Requisition Form", { align: "center" });
    doc.moveDown();

    doc.text(`Requester: ${requisition.requester.fullName}`);
    doc.text(`Department: ${requisition.department}`);
    doc.text(`Date: ${requisition.date}`);
    doc.text(`Status: ${requisition.status}`);

    doc.moveDown();

    requisition.items.forEach((item, index) => {
        doc.text(
            `${index + 1}. ${item.itemName} (${item.category}) - Qty: ${item.quantity}`
        );
    });

    doc.moveDown();
    doc.text(`Notes: ${requisition.notes}`);

    doc.end();
};