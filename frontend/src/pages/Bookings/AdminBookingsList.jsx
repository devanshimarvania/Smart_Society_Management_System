import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import bookingService from "../../services/bookingService";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";

const AdminBookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await bookingService.getBookings(params);
      setBookings(res.data.bookings);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleApprove = async (id) => {
    try {
      await bookingService.updateApproval(id, "approved");
      toast.success("Booking approved");
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve");
    }
  };

  const handleReject = async () => {
    try {
      await bookingService.updateApproval(rejectTarget._id, "rejected", rejectionReason);
      toast.success("Booking rejected");
      setRejectTarget(null);
      setRejectionReason("");
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0">Facility Bookings</h4>
        <select
          className="form-select form-select-sm"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="section-card">
        {loading ? (
          <Spinner />
        ) : bookings.length === 0 ? (
          <p className="text-muted small text-center py-4">No bookings found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Resident</th>
                  <th>Flat</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>{b.facility?.name}</td>
                    <td>{b.resident?.user?.name}</td>
                    <td>{b.resident?.flat?.block}-{b.resident?.flat?.flatNumber}</td>
                    <td className="small">{new Date(b.bookingDate).toLocaleDateString()}</td>
                    <td className="small">{b.startTime} - {b.endTime}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td className="text-end">
                      {b.status === "pending" && (
                        <>
                          <button
                            className="btn btn-sm btn-success me-1"
                            onClick={() => handleApprove(b._id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setRejectTarget(b)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal show={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Booking">
        <p className="small text-muted">
          Provide a reason for rejecting this booking (optional).
        </p>
        <textarea
          className="form-control mb-3"
          rows="3"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        ></textarea>
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-light" onClick={() => setRejectTarget(null)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleReject}>
            Reject Booking
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminBookingsList;
