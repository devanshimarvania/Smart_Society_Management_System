import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import pollService from "../../services/pollService";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";

const PollsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailPoll, setDetailPoll] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { options: ["", ""] } });

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const res = await pollService.getPolls();
      setPolls(res.data.polls);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load polls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const openCreateModal = () => {
    reset({ question: "", description: "", options: ["", ""], expiresAt: "" });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      const options = data.options.filter((o) => o.trim() !== "");
      if (options.length < 2) {
        toast.error("At least 2 options are required");
        return;
      }
      await pollService.createPoll({ ...data, options });
      toast.success("Poll created successfully");
      setShowModal(false);
      fetchPolls();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create poll");
    }
  };

  const viewPoll = async (id) => {
    try {
      const res = await pollService.getPollResults(id);
      setDetailPoll(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load poll");
    }
  };

  const handleVote = async (optionId) => {
    try {
      await pollService.castVote(detailPoll.poll._id, optionId);
      toast.success("Vote cast successfully");
      viewPoll(detailPoll.poll._id);
      fetchPolls();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cast vote");
    }
  };

  const handleClose = async (id) => {
    try {
      await pollService.closePoll(id);
      toast.success("Poll closed");
      setDetailPoll(null);
      fetchPolls();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to close poll");
    }
  };

  const handleDelete = async () => {
    try {
      await pollService.deletePoll(deleteTarget._id);
      toast.success("Poll deleted");
      setDeleteTarget(null);
      fetchPolls();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete poll");
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Polls</h4>
        {user.role === "admin" && (
          <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
            <i className="bi bi-plus-lg me-1"></i> Create Poll
          </button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : polls.length === 0 ? (
        <p className="text-muted small text-center py-4">No polls available.</p>
      ) : (
        <div className="row g-3">
          {polls.map((p) => (
            <div key={p._id} className="col-md-6">
              <div className="section-card h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="mb-0">{p.question}</h6>
                  <span className={`badge ${p.isActive ? "bg-success" : "bg-secondary"}`}>
                    {p.isActive ? "Active" : "Closed"}
                  </span>
                </div>
                <p className="small text-muted mb-2">{p.description}</p>
                <div className="text-muted mb-3" style={{ fontSize: "0.78rem" }}>
                  Expires {new Date(p.expiresAt).toLocaleDateString()}
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-primary flex-fill" onClick={() => viewPoll(p._id)}>
                    {user.role === "resident" ? "Vote / View Results" : "View Results"}
                  </button>
                  {user.role === "admin" && (
                    <button
                      className="btn btn-sm btn-light text-danger"
                      onClick={() => setDeleteTarget(p)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Poll Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} title="Create Poll">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Question</label>
            <input
              className={`form-control ${errors.question ? "is-invalid" : ""}`}
              {...register("question", { required: "Required" })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Description (optional)</label>
            <textarea className="form-control" rows="2" {...register("description")}></textarea>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Options (min 2)</label>
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                className="form-control mb-2"
                placeholder={`Option ${i + 1}${i >= 2 ? " (optional)" : ""}`}
                {...register(`options.${i}`)}
              />
            ))}
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Expires On</label>
            <input
              type="date"
              className={`form-control ${errors.expiresAt ? "is-invalid" : ""}`}
              {...register("expiresAt", { required: "Required" })}
            />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Poll"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Results / Vote Modal */}
      <Modal show={!!detailPoll} onClose={() => setDetailPoll(null)} title={detailPoll?.poll?.question}>
        {detailPoll && (
          <div>
            <p className="small text-muted mb-3">{detailPoll.poll.description}</p>
            <div className="mb-3">
              {detailPoll.results.map((opt) => {
                const pct =
                  detailPoll.totalVotes > 0
                    ? Math.round((opt.voteCount / detailPoll.totalVotes) * 100)
                    : 0;
                const isMyVote = detailPoll.myVote === opt.optionId;
                return (
                  <div key={opt.optionId} className="mb-3">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className={isMyVote ? "fw-bold text-primary" : ""}>
                        {opt.text} {isMyVote && <i className="bi bi-check-circle-fill ms-1"></i>}
                      </span>
                      <span className="text-muted">{opt.voteCount} votes ({pct}%)</span>
                    </div>
                    <div className="progress" style={{ height: 8 }}>
                      <div className="progress-bar" style={{ width: `${pct}%` }}></div>
                    </div>
                    {user.role === "resident" &&
                      !detailPoll.myVote &&
                      detailPoll.poll.isActive && (
                        <button
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={() => handleVote(opt.optionId)}
                        >
                          Vote for this option
                        </button>
                      )}
                  </div>
                );
              })}
            </div>
            <p className="text-muted small">Total votes: {detailPoll.totalVotes}</p>

            {user.role === "admin" && detailPoll.poll.isActive && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleClose(detailPoll.poll._id)}>
                Close Poll Early
              </button>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        show={!!deleteTarget}
        title="Delete Poll"
        message="This will permanently delete the poll and all its votes. Continue?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default PollsPage;
