import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import residentService from "../../services/residentService";
import familyMemberService from "../../services/familyMemberService";
import vehicleService from "../../services/vehicleService";
import Spinner from "../../components/Spinner";

const ResidentDetail = () => {
  const { id } = useParams();
  const [resident, setResident] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [resResident, resFamily, resVehicles] = await Promise.all([
          residentService.getResidentById(id),
          familyMemberService.getFamilyMembersByResident(id),
          vehicleService.getVehiclesByResident(id),
        ]);
        setResident(resResident.data.resident);
        setFamilyMembers(resFamily.data.familyMembers);
        setVehicles(resVehicles.data.vehicles);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load resident");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) return <Spinner />;
  if (!resident) return <p className="text-muted">Resident not found.</p>;

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/admin/residents" className="btn btn-sm btn-light">
          <i className="bi bi-arrow-left"></i>
        </Link>
        <h4 className="mb-0">{resident.user?.name}</h4>
      </div>

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="section-card">
            <h6 className="mb-3">Profile</h6>
            <table className="table table-sm table-borderless mb-0">
              <tbody>
                <tr>
                  <td className="text-muted small">Email</td>
                  <td className="small">{resident.user?.email}</td>
                </tr>
                <tr>
                  <td className="text-muted small">Phone</td>
                  <td className="small">{resident.user?.phone || "—"}</td>
                </tr>
                <tr>
                  <td className="text-muted small">Flat</td>
                  <td className="small">
                    {resident.flat?.block}-{resident.flat?.flatNumber}
                  </td>
                </tr>
                <tr>
                  <td className="text-muted small">Type</td>
                  <td className="small text-capitalize">{resident.residentType}</td>
                </tr>
                <tr>
                  <td className="text-muted small">Move-in Date</td>
                  <td className="small">
                    {resident.moveInDate
                      ? new Date(resident.moveInDate).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
                <tr>
                  <td className="text-muted small">Emergency Contact</td>
                  <td className="small">
                    {resident.emergencyContact?.name
                      ? `${resident.emergencyContact.name} (${resident.emergencyContact.phone})`
                      : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="section-card h-100">
            <h6 className="mb-3">Family Members ({familyMembers.length})</h6>
            {familyMembers.length === 0 ? (
              <p className="text-muted small">No family members added.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {familyMembers.map((fm) => (
                  <li key={fm._id} className="list-group-item px-0">
                    <div className="small fw-semibold">{fm.name}</div>
                    <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                      {fm.relation} {fm.age ? `• ${fm.age} yrs` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="section-card h-100">
            <h6 className="mb-3">Vehicles ({vehicles.length})</h6>
            {vehicles.length === 0 ? (
              <p className="text-muted small">No vehicles registered.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {vehicles.map((v) => (
                  <li key={v._id} className="list-group-item px-0">
                    <div className="small fw-semibold">{v.registrationNumber}</div>
                    <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                      {v.vehicleType} {v.brand ? `• ${v.brand} ${v.model || ""}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentDetail;
