import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import noticeService from "../../services/noticeService";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";

const CATEGORY_COLORS = {
  general: "secondary",
  event: "info",
  emergency: "danger",
  maintenance: "warning",
  announcement: "primary",
};

const NoticesPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await noticeService.getNotices();
      setNotices(res.data.notices);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const openCreateModal = () => {
    setEditingNotice(null);
    reset({ title: "", content: "", category: "general", isPinned: false, expiresAt: "" });
    setShowModal(true);
  };

  const openEditModal = (notice) => {
    setEditingNotice(notice);
    reset({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      isPinned: notice.isPinned,
      expiresAt: notice.expiresAt ? notice.expiresAt.slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "attachment" && value?.length > 0) {
          formData.append("attachment", value[0]);
        } else if (key !== "attachment") {
          formData.append(key, value);
        }
      });

      if (editingNotice) {
        await noticeService.updateNotice(editingNotice._id, formData);
        toast.success("Notice updated");
      } else {
        await noticeService.createNotice(formData);
        toast.success("Notice posted");
      }
      setShowModal(false);
      fetchNotices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async () => {
    try {
      await noticeService.deleteNotice(deleteTarget._id);
      toast.success("Notice deleted");
      setDeleteTarget(null);
      fetchNotices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Notice Board</h4>
        {user.role === "admin" && (
          <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
            <i className="bi bi-plus-lg me-1"></i> Post Notice
          </button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : notices.length === 0 ? (
        <p className="text-muted small text-center py-4">No notices posted yet.</p>
      ) : (
        <div className="row g-3">
          {notices.map((n) => (
            <div key={n._id} className="col-md-6">
              <div className="section-card h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2">
                    {n.isPinned && <i className="bi bi-pin-angle-fill text-primary"></i>}
                    <h6 className="mb-0">{n.title}</h6>
                  </div>
                  <span className={`badge bg-${CATEGORY_COLORS[n.category]}-subtle text-${CATEGORY_COLORS[n.category]} text-capitalize`}>
                    {n.category}
                  </span>
                </div>
                <p className="small mb-2">{n.content}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted" style={{ fontSize: "0.78rem" }}>
                    By {n.postedBy?.name} • {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                  {user.role === "admin" && (
                    <div>
                      <button className="btn btn-sm btn-light me-1" onClick={() => openEditModal(n)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-light text-danger"
                        onClick={() => setDeleteTarget(n)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} title={editingNotice ? "Edit Notice" : "Post Notice"}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Title</label>
            <input
              className={`form-control ${errors.title ? "is-invalid" : ""}`}
              {...register("title", { required: "Required" })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Content</label>
            <textarea
              className={`form-control ${errors.content ? "is-invalid" : ""}`}
              rows="3"
              {...register("content", { required: "Required" })}
            ></textarea>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label small fw-semibold">Category</label>
              <select className="form-select" {...register("category")}>
                <option value="general">General</option>
                <option value="event">Event</option>
                <option value="emergency">Emergency</option>
                <option value="maintenance">Maintenance</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Expires On (optional)</label>
              <input type="date" className="form-control" {...register("expiresAt")} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Attachment (optional)</label>
            <input type="file" className="form-control" {...register("attachment")} />
          </div>
          <div className="form-check mb-3">
            <input className="form-check-input" type="checkbox" {...register("isPinned")} />
            <label className="form-check-label small">Pin this notice to the top</label>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingNotice ? "Update" : "Post"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        show={!!deleteTarget}
        title="Delete Notice"
        message={`Delete notice "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default NoticesPage;
