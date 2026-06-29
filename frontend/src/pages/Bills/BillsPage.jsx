import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import billService from "../../services/billService";
import reportService from "../../services/reportService";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";

const BillsPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await billService.getMyBills();
      setBills(res.data.bills);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleDownload = async (billId) => {
    try {
      await reportService.downloadInvoicePDF(billId);
    } catch (err) {
      toast.error("Failed to download invoice");
    }
  };

  const totalDue = bills
    .filter((b) => b.status !== "paid")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">My Bills</h4>
        {totalDue > 0 && (
          <span className="badge bg-danger-subtle text-danger fs-6">
            Total Due: ₹{totalDue}
          </span>
        )}
      </div>

      <div className="section-card">
        {loading ? (
          <Spinner />
        ) : bills.length === 0 ? (
          <p className="text-muted small text-center py-4">No bills yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Month</th>
                  <th>Base Amount</th>
                  <th>Penalty</th>
                  <th>Total</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b._id}>
                    <td>{b.invoiceNumber}</td>
                    <td>{b.billMonth}</td>
                    <td>₹{b.baseAmount}</td>
                    <td>{b.penaltyAmount > 0 ? `₹${b.penaltyAmount}` : "—"}</td>
                    <td className="fw-semibold">₹{b.totalAmount}</td>
                    <td className="small text-muted">
                      {new Date(b.dueDate).toLocaleDateString()}
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => handleDownload(b._id)}
                      >
                        <i className="bi bi-download me-1"></i> Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillsPage;
