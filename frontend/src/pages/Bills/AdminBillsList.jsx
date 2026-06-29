import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import billService from "../../services/billService";
import flatService from "../../services/flatService";
import paymentService from "../../services/paymentService";
import reportService from "../../services/reportService";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";

const AdminBillsList = () => {
  const [bills, setBills] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [payTarget, setPayTarget] = useState(null);

  const generateForm = useForm();
  const bulkForm = useForm();
  const payForm = useForm();

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await billService.getBills(params);
      setBills(res.data.bills);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const fetchFlats = async () => {
    try {
      const res = await flatService.getFlats();
      setFlats(res.data.flats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openGenerateModal = () => {
    generateForm.reset({ flatId: "", billMonth: "", baseAmount: "", dueDate: "" });
    fetchFlats();
    setShowGenerateModal(true);
  };

  const onGenerate = async (data) => {
    try {
      await billService.generateBill(data);
      toast.success("Bill generated successfully");
      setShowGenerateModal(false);
      fetchBills();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate bill");
    }
  };

  const onBulkGenerate = async (data) => {
    try {
      const res = await billService.bulkGenerateBills(data);
      toast.success(res.data.message);
      setShowBulkModal(false);
      fetchBills();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to bulk generate");
    }
  };

  const handleRunOverdueCheck = async () => {
    try {
      const res = await billService.runOverdueCheck();
      toast.success(res.data.message);
      fetchBills();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to run overdue check");
    }
  };

  const openPayModal = (bill) => {
    payForm.reset({ amountPaid: bill.totalAmount, paymentMethod: "cash", transactionRef: "" });
    setPayTarget(bill);
  };

  const onRecordPayment = async (data) => {
    try {
      await paymentService.recordPayment({ billId: payTarget._id, ...data });
      toast.success("Payment recorded");
      setPayTarget(null);
      fetchBills();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    }
  };

  const handleDownloadInvoice = async (billId) => {
    try {
      await reportService.downloadInvoicePDF(billId);
    } catch (err) {
      toast.error("Failed to download invoice");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0">Bills & Payments</h4>
        <div className="d-flex gap-2 flex-wrap">
          <select
            className="form-select form-select-sm"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <button className="btn btn-outline-secondary btn-sm" onClick={handleRunOverdueCheck}>
            Run Overdue Check
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={() => setShowBulkModal(true)}>
            Bulk Generate
          </button>
          <button className="btn btn-primary btn-sm" onClick={openGenerateModal}>
            <i className="bi bi-plus-lg me-1"></i> Generate Bill
          </button>
        </div>
      </div>

      <div className="section-card">
        {loading ? (
          <Spinner />
        ) : bills.length === 0 ? (
          <p className="text-muted small text-center py-4">No bills found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Flat</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b._id}>
                    <td>{b.invoiceNumber}</td>
                    <td>{b.flat?.block}-{b.flat?.flatNumber}</td>
                    <td>{b.billMonth}</td>
                    <td>₹{b.totalAmount}</td>
                    <td className="small text-muted">
                      {new Date(b.dueDate).toLocaleDateString()}
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-light me-1"
                        onClick={() => handleDownloadInvoice(b._id)}
                      >
                        <i className="bi bi-download"></i>
                      </button>
                      {b.status !== "paid" && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => openPayModal(b)}
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal show={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate Bill">
        <form onSubmit={generateForm.handleSubmit(onGenerate)}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Flat</label>
            <select className="form-select" {...generateForm.register("flatId", { required: true })}>
              <option value="">Select flat</option>
              {flats.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.block}-{f.flatNumber}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Bill Month (YYYY-MM)</label>
            <input
              className="form-control"
              placeholder="2026-06"
              {...generateForm.register("billMonth", { required: true })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">
              Base Amount (leave blank to use flat's default maintenance)
            </label>
            <input type="number" className="form-control" {...generateForm.register("baseAmount")} />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Due Date</label>
            <input type="date" className="form-control" {...generateForm.register("dueDate", { required: true })} />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light" onClick={() => setShowGenerateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">Generate</button>
          </div>
        </form>
      </Modal>

      <Modal show={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Generate Bills">
        <p className="small text-muted">
          Generates a bill for every occupied flat for the given month.
        </p>
        <form onSubmit={bulkForm.handleSubmit(onBulkGenerate)}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Bill Month (YYYY-MM)</label>
            <input
              className="form-control"
              placeholder="2026-06"
              {...bulkForm.register("billMonth", { required: true })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Due Date</label>
            <input type="date" className="form-control" {...bulkForm.register("dueDate", { required: true })} />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light" onClick={() => setShowBulkModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">Generate All</button>
          </div>
        </form>
      </Modal>

      <Modal show={!!payTarget} onClose={() => setPayTarget(null)} title="Record Payment">
        <form onSubmit={payForm.handleSubmit(onRecordPayment)}>
          <p className="small text-muted">
            Invoice {payTarget?.invoiceNumber} — Total due: ₹{payTarget?.totalAmount}
          </p>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Amount Paid</label>
            <input
              type="number"
              className="form-control"
              {...payForm.register("amountPaid", { required: true })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Payment Method</label>
            <select className="form-select" {...payForm.register("paymentMethod")}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank-transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Transaction Reference (optional)</label>
            <input className="form-control" {...payForm.register("transactionRef")} />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light" onClick={() => setPayTarget(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success">Record Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminBillsList;
