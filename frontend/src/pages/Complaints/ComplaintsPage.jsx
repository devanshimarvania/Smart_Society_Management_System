import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import complaintService from "../../services/complaintService";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";

const ComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getMyComplaints();
      setComplaints(res.data.complaints);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const openCreateModal = () => {
    reset({ category: "plumbing", title: "", description: "", priority: "medium" });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("category", data.category);
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("priority", data.priority);
      if (data.images && data.images.length > 0) {
        Array.from(data.images).forEach((file) => formData.append("images", file));
      }
      await complaintService.raiseComplaint(formData);
      toast.success("Complaint raised successfully");
      setShowModal(false);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to raise complaint");
    }
  };

  const handleReopen = async (id) => {
    try {
      await complaintService.reopenComplaint(id, "Issue persists - reopening");
      toast.success("Complaint reopened");
      setDetailComplaint(null);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reopen");
    }
  };

  const viewDetail = async (id) => {
    try {
      const res = await complaintService.getComplaintById(id);
      setDetailComplaint(res.data.complaint);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load complaint");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">My Complaints</h4>
        <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
          <i className="bi bi-plus-lg me-1"></i> Raise Complaint
        </button>
      </div>

      <div className="section-card">
        {loading ? (
          <Spinner />
        ) : complaints.length === 0 ? (
          <p className="text-muted small text-center py-4">You haven't raised any complaints.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Raised On</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id}>
                    <td>{c.title}</td>
                    <td className="text-capitalize">{c.category}</td>
                    <td className="text-capitalize">{c.priority}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="small text-muted">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-light" onClick={() => viewDetail(c._id)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal show={showModal} onClose={() => setShowModal(false)} title="Raise Complaint">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label small fw-semibold">Category</label>
              <select className="form-select" {...register("category")}>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="security">Security</option>
                <option value="lift">Lift</option>
                <option value="parking">Parking</option>
                <option value="noise">Noise</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Priority</label>
              <select className="form-select" {...register("priority")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Title</label>
              <input
                className={`form-control ${errors.title ? "is-invalid" : ""}`}
                {...register("title", { required: "Required" })}
              />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Description</label>
              <textarea
                className={`form-control ${errors.description ? "is-invalid" : ""}`}
                rows="3"
                {...register("description", { required: "Required" })}
              ></textarea>
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">
                Photos (optional, up to 5)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                className="form-control"
                {...register("images")}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Raise Complaint"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        show={!!detailComplaint}
        onClose={() => setDetailComplaint(null)}
        title={detailComplaint?.title}
      >
        {detailComplaint && (
          <div>
            <p className="small">{detailComplaint.description}</p>
            <div className="d-flex gap-2 mb-3">
              <StatusBadge status={detailComplaint.status} />
              <span className="badge bg-light text-dark text-capitalize">
                {detailComplaint.category}
              </span>
            </div>

            <h6 className="small fw-semibold">Timeline</h6>
            <ul className="list-group list-group-flush mb-3">
              {detailComplaint.timeline?.map((t, i) => (
                <li key={i} className="list-group-item px-0">
                  <div className="d-flex justify-content-between">
                    <span className="small text-capitalize fw-semibold">{t.status}</span>
                    <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                      {new Date(t.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {t.note && <div className="text-muted small">{t.note}</div>}
                </li>
              ))}
            </ul>

            {["completed", "closed"].includes(detailComplaint.status) && (
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => handleReopen(detailComplaint._id)}
              >
                Reopen Complaint
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ComplaintsPage;
