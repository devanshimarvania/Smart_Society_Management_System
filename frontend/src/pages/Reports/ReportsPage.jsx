import { useState } from "react";
import { toast } from "react-toastify";
import reportService from "../../services/reportService";

const ReportsPage = () => {
  const [billMonth, setBillMonth] = useState("");
  const [complaintStatus, setComplaintStatus] = useState("");
  const [downloading, setDownloading] = useState("");

  const handleBillsExcel = async () => {
    setDownloading("bills");
    try {
      await reportService.downloadBillsExcel(billMonth ? { billMonth } : {});
      toast.success("Bills report downloaded");
    } catch (err) {
      toast.error("Failed to download report");
    } finally {
      setDownloading("");
    }
  };

  const handleComplaintsExcel = async () => {
    setDownloading("complaints");
    try {
      await reportService.downloadComplaintsExcel(
        complaintStatus ? { status: complaintStatus } : {}
      );
      toast.success("Complaints report downloaded");
    } catch (err) {
      toast.error("Failed to download report");
    } finally {
      setDownloading("");
    }
  };

  return (
    <div>
      <h4 className="mb-3">Reports</h4>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="section-card h-100">
            <h6 className="mb-2">
              <i className="bi bi-file-earmark-spreadsheet me-2 text-success"></i>
              Bills Report (Excel)
            </h6>
            <p className="text-muted small">
              Export all billing records, optionally filtered by month.
            </p>
            <label className="form-label small fw-semibold">Bill Month (optional)</label>
            <input
              className="form-control mb-3"
              placeholder="2026-06"
              value={billMonth}
              onChange={(e) => setBillMonth(e.target.value)}
            />
            <button
              className="btn btn-success btn-sm"
              onClick={handleBillsExcel}
              disabled={downloading === "bills"}
            >
              <i className="bi bi-download me-1"></i>
              {downloading === "bills" ? "Downloading..." : "Download Excel"}
            </button>
          </div>
        </div>

        <div className="col-md-6">
          <div className="section-card h-100">
            <h6 className="mb-2">
              <i className="bi bi-file-earmark-spreadsheet me-2 text-success"></i>
              Complaints Report (Excel)
            </h6>
            <p className="text-muted small">
              Export all complaint records, optionally filtered by status.
            </p>
            <label className="form-label small fw-semibold">Status (optional)</label>
            <select
              className="form-select mb-3"
              value={complaintStatus}
              onChange={(e) => setComplaintStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="raised">Raised</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>
            <button
              className="btn btn-success btn-sm"
              onClick={handleComplaintsExcel}
              disabled={downloading === "complaints"}
            >
              <i className="bi bi-download me-1"></i>
              {downloading === "complaints" ? "Downloading..." : "Download Excel"}
            </button>
          </div>
        </div>
      </div>

      <div className="section-card mt-3">
        <h6 className="mb-2">
          <i className="bi bi-file-earmark-pdf me-2 text-danger"></i>
          Invoice PDFs
        </h6>
        <p className="text-muted small mb-0">
          Individual invoice PDFs can be downloaded from the Bills & Payments
          page next to each bill.
        </p>
      </div>
    </div>
  );
};

export default ReportsPage;
