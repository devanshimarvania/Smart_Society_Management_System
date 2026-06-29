import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import flatService from "../../services/flatService";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";

const FlatsList = () => {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFlat, setEditingFlat] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterBlock, setFilterBlock] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const fetchFlats = async () => {
    setLoading(true);
    try {
      const params = filterBlock ? { block: filterBlock } : {};
      const res = await flatService.getFlats(params);
      setFlats(res.data.flats);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load flats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBlock]);

  const openCreateModal = () => {
    setEditingFlat(null);
    reset({ flatNumber: "", block: "", floor: "", type: "2BHK", area: "", maintenanceAmount: "" });
    setShowModal(true);
  };

  const openEditModal = (flat) => {
    setEditingFlat(flat);
    reset({
      flatNumber: flat.flatNumber,
      block: flat.block,
      floor: flat.floor,
      type: flat.type,
      area: flat.area,
      maintenanceAmount: flat.maintenanceAmount,
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingFlat) {
        await flatService.updateFlat(editingFlat._id, data);
        toast.success("Flat updated successfully");
      } else {
        await flatService.createFlat(data);
        toast.success("Flat created successfully");
      }
      setShowModal(false);
      fetchFlats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async () => {
    try {
      await flatService.deleteFlat(deleteTarget._id);
      toast.success("Flat deleted successfully");
      setDeleteTarget(null);
      fetchFlats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete flat");
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0">Flats</h4>
        <div className="d-flex gap-2">
          <input
            className="form-control form-control-sm"
            placeholder="Filter by block..."
            value={filterBlock}
            onChange={(e) => setFilterBlock(e.target.value)}
            style={{ width: 160 }}
          />
          <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
            <i className="bi bi-plus-lg me-1"></i> Add Flat
          </button>
        </div>
      </div>

      <div className="section-card">
        {loading ? (
          <Spinner />
        ) : flats.length === 0 ? (
          <p className="text-muted small text-center py-4">No flats found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Flat No.</th>
                  <th>Floor</th>
                  <th>Type</th>
                  <th>Maintenance</th>
                  <th>Status</th>
                  <th>Owner / Tenant</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {flats.map((f) => (
                  <tr key={f._id}>
                    <td>{f.block}</td>
                    <td>{f.flatNumber}</td>
                    <td>{f.floor}</td>
                    <td>{f.type}</td>
                    <td>₹{f.maintenanceAmount}</td>
                    <td><StatusBadge status={f.occupancyStatus} /></td>
                    <td>
                      {f.owner?.user?.name || f.tenant?.user?.name || (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-light me-1"
                        onClick={() => openEditModal(f)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-light text-danger"
                        onClick={() => setDeleteTarget(f)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal show={showModal} onClose={() => setShowModal(false)} title={editingFlat ? "Edit Flat" : "Add Flat"}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label small fw-semibold">Block / Wing</label>
              <input
                className={`form-control ${errors.block ? "is-invalid" : ""}`}
                {...register("block", { required: "Required" })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Flat Number</label>
              <input
                className={`form-control ${errors.flatNumber ? "is-invalid" : ""}`}
                {...register("flatNumber", { required: "Required" })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Floor</label>
              <input
                type="number"
                className={`form-control ${errors.floor ? "is-invalid" : ""}`}
                {...register("floor", { required: "Required" })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Type</label>
              <select className="form-select" {...register("type")}>
                <option>1BHK</option>
                <option>2BHK</option>
                <option>3BHK</option>
                <option>4BHK</option>
                <option>Penthouse</option>
                <option>Other</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Area (sq.ft.)</label>
              <input type="number" className="form-control" {...register("area")} />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Monthly Maintenance (₹)</label>
              <input
                type="number"
                className="form-control"
                {...register("maintenanceAmount")}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingFlat ? "Update Flat" : "Create Flat"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        show={!!deleteTarget}
        title="Delete Flat"
        message={`Are you sure you want to delete flat ${deleteTarget?.block}-${deleteTarget?.flatNumber}? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default FlatsList;
