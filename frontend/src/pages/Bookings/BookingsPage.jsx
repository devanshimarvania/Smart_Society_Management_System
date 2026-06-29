import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import bookingService from "../../services/bookingService";
import facilityService from "../../services/facilityService";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingService.getMyBookings();
      setBookings(res.data.bookings);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const res = await facilityService.getFacilities();
      setFacilities(res.data.facilities);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchFacilities();
  }, []);

  const openCreateModal = () => {
    reset({ facilityId: "", bookingDate: "", startTime: "", endTime: "", purpose: "" });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      await bookingService.createBooking(data);
      toast.success("Booking request submitted");
      setShowModal(false);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create booking");
    }
  };

  const handleCancel = async (id) => {
    try {
      await bookingService.cancelBooking(id);
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Facility Bookings</h4>
        <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
          <i className="bi bi-plus-lg me-1"></i> Book Facility
        </button>
      </div>

      <div className="section-card">
        {loading ? (
          <Spinner />
        ) : bookings.length === 0 ? (
          <p className="text-muted small text-center py-4">You haven't booked any facilities yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>{b.facility?.name}</td>
                    <td className="small">{new Date(b.bookingDate).toLocaleDateString()}</td>
                    <td className="small">{b.startTime} - {b.endTime}</td>
                    <td>₹{b.feeCharged}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td className="text-end">
                      {["pending", "approved"].includes(b.status) && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleCancel(b._id)}
                        >
                          Cancel
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

      <Modal show={showModal} onClose={() => setShowModal(false)} title="Book a Facility">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Facility</label>
            <select
              className={`form-select ${errors.facilityId ? "is-invalid" : ""}`}
              {...register("facilityId", { required: "Required" })}
            >
              <option value="">Select a facility</option>
              {facilities.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} (₹{f.bookingFee})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Date</label>
            <input
              type="date"
              className={`form-control ${errors.bookingDate ? "is-invalid" : ""}`}
              {...register("bookingDate", { required: "Required" })}
            />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label small fw-semibold">Start Time</label>
              <input
                type="time"
                className={`form-control ${errors.startTime ? "is-invalid" : ""}`}
                {...register("startTime", { required: "Required" })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">End Time</label>
              <input
                type="time"
                className={`form-control ${errors.endTime ? "is-invalid" : ""}`}
                {...register("endTime", { required: "Required" })}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Purpose (optional)</label>
            <input className="form-control" {...register("purpose")} />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BookingsPage;
