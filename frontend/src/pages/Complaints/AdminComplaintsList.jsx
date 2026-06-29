import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import complaintService from "../../services/complaintService";
import authService from "../../services/authService";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";

const AdminComplaintsList = () => {
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [detailComplaint, setDetailComplaint] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await complaintService.getComplaints(params);
      setComplaints(res.data.complaints);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await authService.listUsers({ role: "maintenance", isActive: true });
      setStaff(res.data.users);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openAssignModal = (complaint) => {
    setSelectedStaffId("");
    setAssignTarget(complaint);
    fetchStaff();
  };

  const handleAssign = async () => {
    if (!selectedStaffId) {
      toast.error("Please select a staff member");
      return;
    }
    try {
      await complaintService.assignComplaint(assignTarget._id, selectedStaffId);
      toast.success("Complaint assigned");
      setAssignTarget(null);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign");
    }
  };

  const handleClose = async (id) => {
    try {
      await complaintService.closeComplaint(id);
      toast.success("Complaint closed");
      setDetailComplaint(null);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to close");
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
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0">Complaints</h4>
        <select
          className="form-select form-select-sm"
          style={{ width: 180 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="raised">Raised</option>
          <option value="assigned">Assigned</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="closed">Closed</option>
          <option value="reopened">Reopened</option>
        </select>
      </div>

      <div className="section-card">
        {loading ? (
          <Spinner />
        ) : complaints.length === 0 ? (
          <p className="text-muted small text-center py-4">No complaints found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Flat</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id}>
                    <td>{c.title}</td>
                    <td>{c.flat?.block}-{c.flat?.flatNumber}</td>
                    <td className="text-capitalize">{c.category}</td>
                    <td className="text-capitalize">{c.priority}</td>
                    <td>{c.assignedTo?.name || <span className="text-muted">Unassigned</span>}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-light me-1" onClick={() => viewDetail(c._id)}>
                        View
                      </button>
                      {c.status === "raised" && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openAssignModal(c)}
                        >
                          Assign
                        </button>
                      )}
                      {c.status === "completed" && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleClose(c._id)}
                        >
                          Close
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

      <Modal show={!!assignTarget} onClose={() => setAssignTarget(null)} title="Assign Complaint">
        <p className="small text-muted">
          Assign "{assignTarget?.title}" to a maintenance staff member.
        </p>
        <select
          className="form-select mb-3"
          value={selectedStaffId}
          onChange={(e) => setSelectedStaffId(e.target.value)}
        >
          <option value="">Select staff member</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.email})
            </option>
          ))}
        </select>
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-light" onClick={() => setAssignTarget(null)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleAssign}>
            Assign
          </button>
        </div>
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
            <p className="small text-muted">
              Raised by {detailComplaint.raisedBy?.user?.name} • Flat{" "}
              {detailComplaint.flat?.block}-{detailComplaint.flat?.flatNumber}
            </p>

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

            {detailComplaint.status === "completed" && (
              <button
                className="btn btn-success btn-sm"
                onClick={() => handleClose(detailComplaint._id)}
              >
                Close Complaint
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminComplaintsList;
