import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import facilityService from "../../services/facilityService";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";

const FacilitiesList = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const res = await facilityService.getFacilities();
      setFacilities(res.data.facilities);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load facilities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const openCreateModal = () => {
    setEditingFacility(null);
    reset({
      name: "",
      description: "",
      type: "gym",
      capacity: 1,
      openTime: "06:00",
      closeTime: "22:00",
      bookingFee: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (facility) => {
    setEditingFacility(facility);
    reset({
      name: facility.name,
      description: facility.description,
      type: facility.type,
      capacity: facility.capacity,
      openTime: facility.openTime,
      closeTime: facility.closeTime,
      bookingFee: facility.bookingFee,
      isActive: facility.isActive,
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "image" && value?.length > 0) {
          formData.append("image", value[0]);
        } else if (key !== "image") {
          formData.append(key, value);
        }
      });

      if (editingFacility) {
        await facilityService.updateFacility(editingFacility._id, formData);
        toast.success("Facility updated successfully");
      } else {
        await facilityService.createFacility(formData);
        toast.success("Facility created successfully");
      }
      setShowModal(false);
      fetchFacilities();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async () => {
    try {
      await facilityService.deleteFacility(deleteTarget._id);
      toast.success("Facility deleted successfully");
      setDeleteTarget(null);
      fetchFacilities();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete facility");
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Facilities</h4>
        <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
          <i className="bi bi-plus-lg me-1"></i> Add Facility
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : facilities.length === 0 ? (
        <p className="text-muted small text-center py-4">No facilities added yet.</p>
      ) : (
        <div className="row g-3">
          {facilities.map((f) => (
            <div key={f._id} className="col-md-6 col-lg-4">
              <div className="section-card h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <h6 className="mb-1">{f.name}</h6>
                  <span className={`badge ${f.isActive ? "bg-success" : "bg-secondary"}`}>
                    {f.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-muted small mb-2 text-capitalize">{f.type.replace("-", " ")}</p>
                <p className="small mb-2">{f.description}</p>
                <div className="small text-muted mb-3">
                  <div>Hours: {f.openTime} - {f.closeTime}</div>
                  <div>Capacity: {f.capacity}</div>
                  <div>Booking Fee: ₹{f.bookingFee}</div>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-light flex-fill" onClick={() => openEditModal(f)}>
                    <i className="bi bi-pencil"></i> Edit
                  </button>
                  <button
                    className="btn btn-sm btn-light text-danger"
                    onClick={() => setDeleteTarget(f)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} title={editingFacility ? "Edit Facility" : "Add Facility"}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label small fw-semibold">Name</label>
              <input
                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                {...register("name", { required: "Required" })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Type</label>
              <select className="form-select" {...register("type")}>
                <option value="gym">Gym</option>
                <option value="swimming-pool">Swimming Pool</option>
                <option value="club-house">Club House</option>
                <option value="party-hall">Party Hall</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Description</label>
              <textarea className="form-control" rows="2" {...register("description")}></textarea>
            </div>
            <div className="col-4">
              <label className="form-label small fw-semibold">Capacity</label>
              <input type="number" className="form-control" {...register("capacity")} />
            </div>
            <div className="col-4">
              <label className="form-label small fw-semibold">Open Time</label>
              <input type="time" className="form-control" {...register("openTime")} />
            </div>
            <div className="col-4">
              <label className="form-label small fw-semibold">Close Time</label>
              <input type="time" className="form-control" {...register("closeTime")} />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Booking Fee (₹)</label>
              <input type="number" className="form-control" {...register("bookingFee")} />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Image</label>
              <input type="file" accept="image/*" className="form-control" {...register("image")} />
            </div>
            {editingFacility && (
              <div className="col-12">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    {...register("isActive")}
                  />
                  <label className="form-check-label small">Active (visible for booking)</label>
                </div>
              </div>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingFacility ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        show={!!deleteTarget}
        title="Delete Facility"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default FacilitiesList;
