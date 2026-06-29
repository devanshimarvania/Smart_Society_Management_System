const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const Bill = require("../models/Bill");
const Complaint = require("../models/Complaint");
const Resident = require("../models/Resident");

// @desc    Generate a PDF invoice for a single bill
// @route   GET /api/reports/invoice/:billId
// @access  Private (admin, or the owning resident)
const generateInvoicePDF = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.billId)
      .populate("flat", "flatNumber block")
      .populate({
        path: "resident",
        populate: { path: "user", select: "name email phone" },
      });

    if (!bill) {
      res.statusCode = 404;
      throw new Error("Bill not found");
    }

    if (req.user.role === "resident") {
      const resident = await Resident.findOne({ user: req.user._id });
      if (!resident || bill.resident._id.toString() !== resident._id.toString()) {
        res.statusCode = 403;
        throw new Error("Access denied. This is not your bill");
      }
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${bill.invoiceNumber}.pdf`
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(20)
      .fillColor("#2c3e50")
      .text("Smart Society Management", { align: "center" });
    doc
      .fontSize(12)
      .fillColor("#555")
      .text("Maintenance Bill Invoice", { align: "center" });
    doc.moveDown(1.5);

    // Invoice meta
    doc.fontSize(10).fillColor("#000");
    doc.text(`Invoice Number: ${bill.invoiceNumber}`);
    doc.text(`Bill Month: ${bill.billMonth}`);
    doc.text(`Due Date: ${new Date(bill.dueDate).toLocaleDateString()}`);
    doc.text(`Status: ${bill.status.toUpperCase()}`);
    doc.moveDown(1);

    // Resident & flat info
    doc.fontSize(12).fillColor("#2c3e50").text("Billed To:");
    doc.fontSize(10).fillColor("#000");
    doc.text(`Name: ${bill.resident.user.name}`);
    doc.text(`Email: ${bill.resident.user.email}`);
    doc.text(`Phone: ${bill.resident.user.phone || "N/A"}`);
    doc.text(`Flat: ${bill.flat.block}-${bill.flat.flatNumber}`);
    doc.moveDown(1.5);

    // Table header
    const tableTop = doc.y;
    doc.fontSize(11).fillColor("#fff");
    doc.rect(50, tableTop, 500, 25).fill("#4f46e5");
    doc.fillColor("#fff").text("Description", 60, tableTop + 7);
    doc.text("Amount (₹)", 450, tableTop + 7);

    let rowY = tableTop + 25;
    doc.fillColor("#000").fontSize(10);

    doc.text("Base Maintenance Amount", 60, rowY + 10);
    doc.text(`${bill.baseAmount}`, 450, rowY + 10);
    rowY += 30;

    if (bill.penaltyAmount > 0) {
      doc.text("Late Payment Penalty", 60, rowY + 10);
      doc.text(`${bill.penaltyAmount}`, 450, rowY + 10);
      rowY += 30;
    }

    doc.moveTo(50, rowY + 5).lineTo(550, rowY + 5).stroke();
    rowY += 15;

    doc.fontSize(12).fillColor("#2c3e50");
    doc.text("Total Amount Due", 60, rowY + 10);
    doc.text(`₹${bill.totalAmount}`, 450, rowY + 10);

    doc.moveDown(4);
    doc
      .fontSize(9)
      .fillColor("#999")
      .text("This is a system-generated invoice.", { align: "center" });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Export all bills for a given month as an Excel sheet
// @route   GET /api/reports/bills-excel?billMonth=2026-06
// @access  Private (admin only)
const exportBillsExcel = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.billMonth) filter.billMonth = req.query.billMonth;
    if (req.query.status) filter.status = req.query.status;

    const bills = await Bill.find(filter)
      .populate("flat", "flatNumber block")
      .populate({
        path: "resident",
        populate: { path: "user", select: "name email phone" },
      })
      .sort({ "flat.block": 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Bills");

    sheet.columns = [
      { header: "Invoice Number", key: "invoiceNumber", width: 20 },
      { header: "Flat", key: "flat", width: 12 },
      { header: "Resident Name", key: "residentName", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Bill Month", key: "billMonth", width: 12 },
      { header: "Base Amount", key: "baseAmount", width: 14 },
      { header: "Penalty", key: "penaltyAmount", width: 12 },
      { header: "Total Amount", key: "totalAmount", width: 14 },
      { header: "Due Date", key: "dueDate", width: 14 },
      { header: "Status", key: "status", width: 12 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    bills.forEach((bill) => {
      sheet.addRow({
        invoiceNumber: bill.invoiceNumber,
        flat: `${bill.flat?.block || ""}-${bill.flat?.flatNumber || ""}`,
        residentName: bill.resident?.user?.name || "N/A",
        email: bill.resident?.user?.email || "N/A",
        phone: bill.resident?.user?.phone || "N/A",
        billMonth: bill.billMonth,
        baseAmount: bill.baseAmount,
        penaltyAmount: bill.penaltyAmount,
        totalAmount: bill.totalAmount,
        dueDate: new Date(bill.dueDate).toLocaleDateString(),
        status: bill.status,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bills-report-${req.query.billMonth || "all"}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Export all complaints as an Excel sheet
// @route   GET /api/reports/complaints-excel?status=completed
// @access  Private (admin only)
const exportComplaintsExcel = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    const complaints = await Complaint.find(filter)
      .populate("flat", "flatNumber block")
      .populate("assignedTo", "name")
      .populate({
        path: "raisedBy",
        populate: { path: "user", select: "name phone" },
      })
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Complaints");

    sheet.columns = [
      { header: "Title", key: "title", width: 25 },
      { header: "Category", key: "category", width: 15 },
      { header: "Flat", key: "flat", width: 12 },
      { header: "Raised By", key: "raisedBy", width: 20 },
      { header: "Priority", key: "priority", width: 12 },
      { header: "Assigned To", key: "assignedTo", width: 20 },
      { header: "Status", key: "status", width: 14 },
      { header: "Raised On", key: "raisedOn", width: 16 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" },
    };

    complaints.forEach((c) => {
      sheet.addRow({
        title: c.title,
        category: c.category,
        flat: `${c.flat?.block || ""}-${c.flat?.flatNumber || ""}`,
        raisedBy: c.raisedBy?.user?.name || "N/A",
        priority: c.priority,
        assignedTo: c.assignedTo?.name || "Unassigned",
        status: c.status,
        raisedOn: new Date(c.createdAt).toLocaleDateString(),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=complaints-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateInvoicePDF,
  exportBillsExcel,
  exportComplaintsExcel,
};
