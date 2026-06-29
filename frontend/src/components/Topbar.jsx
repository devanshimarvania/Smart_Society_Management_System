import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../redux/slices/notificationSlice";

const Topbar = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { items, unreadCount } = useSelector((state) => state.notifications);

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications());
    // Poll every 60s for new notifications
    const interval = setInterval(() => dispatch(fetchNotifications()), 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="d-flex align-items-center gap-2">
        <button className="topbar-toggle-btn" onClick={onToggleSidebar}>
          <i className="bi bi-list"></i>
        </button>
        <h6 className="mb-0 text-muted text-capitalize">{user?.role} Panel</h6>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Notifications */}
        <div className="position-relative" ref={notifRef}>
          <button
            className="btn btn-light rounded-circle position-relative"
            onClick={() => setShowNotifs((s) => !s)}
          >
            <i className="bi bi-bell"></i>
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div
              className="card shadow position-absolute end-0 mt-2"
              style={{ width: 340, maxHeight: 420, overflowY: "auto", zIndex: 1050 }}
            >
              <div className="card-header d-flex justify-content-between align-items-center bg-white">
                <strong className="small">Notifications</strong>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-link btn-sm p-0"
                    onClick={() => dispatch(markAllNotificationsRead())}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="list-group list-group-flush">
                {items.length === 0 && (
                  <div className="p-3 text-center text-muted small">
                    No notifications yet
                  </div>
                )}
                {items.slice(0, 15).map((n) => (
                  <button
                    key={n._id}
                    className={`list-group-item list-group-item-action text-start ${
                      !n.isRead ? "bg-light" : ""
                    }`}
                    onClick={() => dispatch(markNotificationRead(n._id))}
                  >
                    <div className="d-flex justify-content-between">
                      <strong className="small">{n.title}</strong>
                      {!n.isRead && <span className="badge bg-primary rounded-circle">&nbsp;</span>}
                    </div>
                    <div className="small text-muted">{n.message}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="position-relative" ref={profileRef}>
          <button
            className="btn btn-light d-flex align-items-center gap-2"
            onClick={() => setShowProfileMenu((s) => !s)}
          >
            <i className="bi bi-person-circle fs-5"></i>
            <span className="d-none d-md-inline">{user?.name}</span>
          </button>

          {showProfileMenu && (
            <div
              className="card shadow position-absolute end-0 mt-2"
              style={{ width: 200, zIndex: 1050 }}
            >
              <div className="list-group list-group-flush">
                <button
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate(`/${user?.role}/settings`)}
                >
                  <i className="bi bi-gear me-2"></i> Settings
                </button>
                <button
                  className="list-group-item list-group-item-action text-danger"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-2"></i> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
