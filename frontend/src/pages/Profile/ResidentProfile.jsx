import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import residentService from "../../services/residentService";
import familyMemberService from "../../services/familyMemberService";
import vehicleService from "../../services/vehicleService";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";

const ResidentProfile = () => {
  const [resident, setResident] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [deleteFamilyTarget, setDeleteFamilyTarget] = useState(null);
  const [deleteVehicleTarget, setDeleteVehicleTarget] = useState(null);

  const familyForm = useForm();
  const vehicleForm = useForm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [resResident, resFamily, resVehicles] = await Promise.all([
        residentService.getMyProfile(),
        familyMemberService.getMyFamilyMembers(),
        vehicleService.getMyVehicles(),
      ]);
      setResident(resResident.data.resident);
      setFamilyMembers(resFamily.data.familyMembers);
      setVehicles(resVehicles.data.vehicles);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openFamilyModal = () => {
    familyForm.reset({ name: "", relation: "spouse", age: "", gender: "male", phone: "" });
    setShowFamilyModal(true);
  };

  const onAddFamily = async (data) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "photo" && value?.length > 0) {
          formData.append("photo", value[0]);
        } else if (key !== "photo") {
          formData.append(key, value);
        }
      });
      await familyMemberService.addFamilyMember(formData);
      toast.success("Family member added");
      setShowFamilyModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add family member");
    }
  };

  const handleDeleteFamily = async () => {
    try {
      await familyMemberService.deleteFamilyMember(deleteFamilyTarget._id);
      toast.success("Family member removed");
      setDeleteFamilyTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove");
      setDeleteFamilyTarget(null);
    }
  };

  const openVehicleModal = () => {
    vehicleForm.reset({
      vehicleType: "car",
      brand: "",
      model: "",
      registrationNumber: "",
      color: "",
      parkingSlot: "",
    });
    setShowVehicleModal(true);
  };

  const onAddVehicle = async (data) => {
    try {
      await vehicleService.addVehicle(data);
      toast.success("Vehicle added");
      setShowVehicleModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add vehicle");
    }
  };

  const handleDeleteVehicle = async () => {
    try {
      await vehicleService.deleteVehicle(deleteVehicleTarget._id);
      toast.success("Vehicle removed");
      setDeleteVehicleTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove");
      setDeleteVehicleTarget(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h4 className="mb-3">My Profile</h4>

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="section-card">
            <h6 className="mb-3">Profile Info</h6>
            <table className="table table-sm table-borderless mb-0">
              <tbody>
                <tr>
                  <td className="text-muted small">Name</td>
                  <td className="small">{resident?.user?.name}</td>
                </tr>
                <tr>
                  <td className="text-muted small">Email</td>
                  <td className="small">{resident?.user?.email}</td>
                </tr>
                <tr>
                  <td className="text-muted small">Phone</td>
                  <td className="small">{resident?.user?.phone || "—"}</td>
                </tr>
                <tr>
                  <td className="text-muted small">Flat</td>
                  <td className="small">
                    {resident?.flat?.block}-{resident?.flat?.flatNumber}
                  </td>
                </tr>
                <tr>
                  <td className="text-muted small">Type</td>
                  <td className="small text-capitalize">{resident?.residentType}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="section-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Family Members</h6>
              <button className="btn btn-sm btn-primary" onClick={openFamilyModal}>
                <i className="bi bi-plus-lg"></i>
              </button>
            </div>
            {familyMembers.length === 0 ? (
              <p className="text-muted small">No family members added.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {familyMembers.map((fm) => (
                  <li key={fm._id} className="list-group-item px-0 d-flex justify-content-between">
                    <div>
                      <div className="small fw-semibold">{fm.name}</div>
                      <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                        {fm.relation} {fm.age ? `• ${fm.age} yrs` : ""}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-light text-danger"
                      onClick={() => setDeleteFamilyTarget(fm)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="section-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Vehicles</h6>
              <button className="btn btn-sm btn-primary" onClick={openVehicleModal}>
                <i className="bi bi-plus-lg"></i>
              </button>
            </div>
            {vehicles.length === 0 ? (
              <p className="text-muted small">No vehicles registered.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {vehicles.map((v) => (
                  <li key={v._id} className="list-group-item px-0 d-flex justify-content-between">
                    <div>
                      <div className="small fw-semibold">{v.registrationNumber}</div>
                      <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                        {v.vehicleType} {v.brand ? `• ${v.brand} ${v.model || ""}` : ""}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-light text-danger"
                      onClick={() => setDeleteVehicleTarget(v)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Add Family Member Modal */}
      <Modal show={showFamilyModal} onClose={() => setShowFamilyModal(false)} title="Add Family Member">
        <form onSubmit={familyForm.handleSubmit(onAddFamily)}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label small fw-semibold">Name</label>
              <input
                className="form-control"
                {...familyForm.register("name", { required: true })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Relation</label>
              <select className="form-select" {...familyForm.register("relation")}>
                <option value="spouse">Spouse</option>
                <option value="son">Son</option>
                <option value="daughter">Daughter</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="brother">Brother</option>
                <option value="sister">Sister</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Age</label>
              <input type="number" className="form-control" {...familyForm.register("age")} />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Gender</label>
              <select className="form-select" {...familyForm.register("gender")}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Phone</label>
              <input className="form-control" {...familyForm.register("phone")} />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Photo (optional)</label>
              <input type="file" accept="image/*" className="form-control" {...familyForm.register("photo")} />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-light" onClick={() => setShowFamilyModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">Add</button>
          </div>
        </form>
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal show={showVehicleModal} onClose={() => setShowVehicleModal(false)} title="Add Vehicle">
        <form onSubmit={vehicleForm.handleSubmit(onAddVehicle)}>
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label small fw-semibold">Vehicle Type</label>
              <select className="form-select" {...vehicleForm.register("vehicleType")}>
                <option value="car">Car</option>
                <option value="bike">Bike</option>
                <option value="scooter">Scooter</option>
                <option value="bicycle">Bicycle</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Registration Number</label>
              <input
                className="form-control"
                {...vehicleForm.register("registrationNumber", { required: true })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Brand</label>
              <input className="form-control" {...vehicleForm.register("brand")} />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Model</label>
              <input className="form-control" {...vehicleForm.register("model")} />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Color</label>
              <input className="form-control" {...vehicleForm.register("color")} />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Parking Slot</label>
              <input className="form-control" {...vehicleForm.register("parkingSlot")} />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-light" onClick={() => setShowVehicleModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">Add</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        show={!!deleteFamilyTarget}
        title="Remove Family Member"
        message={`Remove ${deleteFamilyTarget?.name} from your family members?`}
        onConfirm={handleDeleteFamily}
        onCancel={() => setDeleteFamilyTarget(null)}
      />

      <ConfirmDialog
        show={!!deleteVehicleTarget}
        title="Remove Vehicle"
        message={`Remove vehicle ${deleteVehicleTarget?.registrationNumber}?`}
        onConfirm={handleDeleteVehicle}
        onCancel={() => setDeleteVehicleTarget(null)}
      />
    </div>
  );
};

export default ResidentProfile;
