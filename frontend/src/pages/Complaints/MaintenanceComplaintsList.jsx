import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import complaintService from "../../services/complaintService";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";

const MaintenanceComplaintsList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateTarget, setUpdateTarget] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getAssignedToMe();
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

  const openUpdateModal = (complaint) => {
    reset({ status: "in-progress", note: "" });
    setUpdateTarget(complaint);
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("status", data.status);
      formData.append("note", data.note || "");
      if (data.status === "completed" && data.completionImages?.length > 0) {
        Array.from(data.completionImages).forEach((file) =>
          formData.append("completionImages", file)
        );
      }
      await complaintService.updateStatus(updateTarget._id, formData);
      toast.success("Status updated");
      setUpdateTarget(null);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div>
      <h4 className="mb-3">Assigned Complaints</h4>

      <div className="section-card">
        {loading ? (
          <Spinner />
        ) : complaints.length === 0 ? (
          <p className="text-muted small text-center py-4">No complaints assigned to you.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Flat</th>
                  <th>Category</th>
                  <th>Priority</th>
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
                    <td><StatusBadge status={c.status} /></td>
                    <td className="text-end">
                      {["assigned", "in-progress"].includes(c.status) && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openUpdateModal(c)}
                        >
                          Update Status
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

      <Modal show={!!updateTarget} onClose={() => setUpdateTarget(null)} title="Update Complaint Status">
        <form onSubmit={handleSubmit(onSubmit)}>
          <p className="small text-muted">{updateTarget?.title}</p>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Status</label>
            <select className="form-select" {...register("status")}>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Note</label>
            <textarea className="form-control" rows="2" {...register("note")}></textarea>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">
              Completion Photos (if marking completed)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="form-control"
              {...register("completionImages")}
            />
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-light" onClick={() => setUpdateTarget(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenanceComplaintsList;
