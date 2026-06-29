import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import visitorService from "../../services/visitorService";
import flatService from "../../services/flatService";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";

const VisitorsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [visitors, setVisitors] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      let res;
      if (user.role === "resident") {
        res = await visitorService.getMyHistory();
      } else {
        res = await visitorService.getVisitors();
      }
      setVisitors(res.data.visitors);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load visitors");
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
    fetchVisitors();
    if (user.role === "security") fetchFlats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    reset({ name: "", phone: "", purpose: "guest", visitingFlatId: "", vehicleNumber: "", notes: "" });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      await visitorService.addVisitor(data);
      toast.success("Visitor entry recorded");
      setShowModal(false);
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add visitor");
    }
  };

  const handleApproval = async (id, approvalStatus) => {
    try {
      await visitorService.updateApproval(id, approvalStatus);
      toast.success(`Visitor ${approvalStatus}`);
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update approval");
    }
  };

  const handleExit = async (id) => {
    try {
      await visitorService.markExit(id);
      toast.success("Visitor exit recorded");
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark exit");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">
          {user.role === "resident" ? "Visitor History" : "Visitor Management"}
        </h4>
        {user.role === "security" && (
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            <i className="bi bi-plus-lg me-1"></i> Add Visitor
          </button>
        )}
      </div>

      <div className="section-card">
        {loading ? (
          <Spinner />
        ) : visitors.length === 0 ? (
          <p className="text-muted small text-center py-4">No visitor records found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Purpose</th>
                  {user.role !== "resident" && <th>Flat</th>}
                  <th>Approval</th>
                  <th>Status</th>
                  <th>Entry Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v._id}>
                    <td>{v.name}</td>
                    <td className="text-capitalize">{v.purpose}</td>
                    {user.role !== "resident" && (
                      <td>{v.visitingFlat?.block}-{v.visitingFlat?.flatNumber}</td>
                    )}
                    <td><StatusBadge status={v.approvalStatus} /></td>
                    <td><StatusBadge status={v.status} /></td>
                    <td className="small text-muted">
                      {new Date(v.entryTime || v.createdAt).toLocaleString()}
                    </td>
                    <td className="text-end">
                      {user.role === "resident" && v.approvalStatus === "pending" && (
                        <>
                          <button
                            className="btn btn-sm btn-success me-1"
                            onClick={() => handleApproval(v._id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleApproval(v._id, "rejected")}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {user.role === "security" && v.status === "inside" && (
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => handleExit(v._id)}
                        >
                          Mark Exit
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

      {user.role === "security" && (
        <Modal show={showModal} onClose={() => setShowModal(false)} title="Add Visitor">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label small fw-semibold">Visitor Name</label>
                <input
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  {...register("name", { required: "Required" })}
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold">Phone</label>
                <input
                  className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                  {...register("phone", { required: "Required" })}
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold">Purpose</label>
                <select className="form-select" {...register("purpose")}>
                  <option value="guest">Guest</option>
                  <option value="delivery">Delivery</option>
                  <option value="cab">Cab</option>
                  <option value="service">Service</option>
                  <option value="vendor">Vendor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold">Visiting Flat</label>
                <select
                  className={`form-select ${errors.visitingFlatId ? "is-invalid" : ""}`}
                  {...register("visitingFlatId", { required: "Required" })}
                >
                  <option value="">Select flat</option>
                  {flats.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.block}-{f.flatNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold">Vehicle Number</label>
                <input className="form-control" {...register("vehicleNumber")} />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Notes</label>
                <textarea className="form-control" rows="2" {...register("notes")}></textarea>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Add Visitor"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default VisitorsPage;
