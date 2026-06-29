import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import residentService from "../../services/residentService";
import flatService from "../../services/flatService";
import authService from "../../services/authService";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";

const ResidentsList = () => {
  const [residents, setResidents] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1); // 1 = create user account, 2 = link to flat

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const res = await residentService.getResidents({ search, page, limit: 10 });
      setResidents(res.data.residents);
      setPages(res.data.pages);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load residents");
    } finally {
      setLoading(false);
    }
  };

  const fetchFlats = async () => {
    try {
      const res = await flatService.getFlats({ occupancyStatus: "vacant" });
      setFlats(res.data.flats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchResidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const openCreateModal = () => {
    setStep(1);
    reset({ name: "", email: "", password: "", phone: "", flatId: "", residentType: "owner" });
    fetchFlats();
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      // Step 1: create the User account with role=resident
      const userRes = await authService.createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: "resident",
      });

      // Step 2: link the new user to a flat as a Resident profile
      await residentService.createResident({
        userId: userRes.data.user.id,
        flatId: data.flatId,
        residentType: data.residentType,
      });

      toast.success("Resident account created and linked to flat");
      setShowModal(false);
      fetchResidents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create resident");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0">Residents</h4>
        <div className="d-flex gap-2">
          <input
            className="form-control form-control-sm"
            placeholder="Search by name, email, flat..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            style={{ width: 240 }}
          />
          <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
            <i className="bi bi-plus-lg me-1"></i> Add Resident
          </button>
        </div>
      </div>

      <div className="section-card">
        {loading ? (
          <Spinner />
        ) : residents.length === 0 ? (
          <p className="text-muted small text-center py-4">No residents found.</p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-modern align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Flat</th>
                    <th>Type</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {residents.map((r) => (
                    <tr key={r._id}>
                      <td>{r.user?.name}</td>
                      <td>{r.user?.email}</td>
                      <td>{r.user?.phone || "—"}</td>
                      <td>{r.flat?.block}-{r.flat?.flatNumber}</td>
                      <td className="text-capitalize">{r.residentType}</td>
                      <td className="text-end">
                        <Link to={`/admin/residents/${r._id}`} className="btn btn-sm btn-light">
                          <i className="bi bi-eye"></i> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button
                  className="btn btn-sm btn-light"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span className="small text-muted align-self-center">
                  Page {page} of {pages}
                </span>
                <button
                  className="btn btn-sm btn-light"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal show={showModal} onClose={() => setShowModal(false)} title="Add Resident">
        <form onSubmit={handleSubmit(onSubmit)}>
          <p className="text-muted small">
            This creates a login account for the resident and links them to a flat.
          </p>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label small fw-semibold">Full Name</label>
              <input
                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                {...register("name", { required: "Required" })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Email</label>
              <input
                type="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                {...register("email", { required: "Required" })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Phone</label>
              <input className="form-control" {...register("phone")} />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Temporary Password</label>
              <input
                type="password"
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                {...register("password", {
                  required: "Required",
                  minLength: { value: 6, message: "Minimum 6 characters" },
                })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Assign Flat (vacant)</label>
              <select
                className={`form-select ${errors.flatId ? "is-invalid" : ""}`}
                {...register("flatId", { required: "Required" })}
              >
                <option value="">Select a flat</option>
                {flats.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.block}-{f.flatNumber} ({f.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Resident Type</label>
              <select className="form-select" {...register("residentType")}>
                <option value="owner">Owner</option>
                <option value="tenant">Tenant</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Resident"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ResidentsList;
