import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { forgotPassword, resetAuthStatus } from "../../redux/slices/authSlice";
import { useEffect } from "react";

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { user, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isSuccess && message) {
      toast.success(message);
      dispatch(resetAuthStatus());
    }
    if (isError && message) {
      toast.error(message);
      dispatch(resetAuthStatus());
    }
  }, [isSuccess, isError, message, dispatch]);

  const handleSendResetLink = () => {
    dispatch(forgotPassword({ email: user.email }));
  };

  return (
    <div>
      <h4 className="mb-3">Settings</h4>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="section-card h-100">
            <h6 className="mb-3">My Profile</h6>
            <table className="table table-sm table-borderless mb-0">
              <tbody>
                <tr>
                  <td className="text-muted small">Name</td>
                  <td className="small">{user?.name}</td>
                </tr>
                <tr>
                  <td className="text-muted small">Email</td>
                  <td className="small">{user?.email}</td>
                </tr>
                <tr>
                  <td className="text-muted small">Phone</td>
                  <td className="small">{user?.phone || "—"}</td>
                </tr>
                <tr>
                  <td className="text-muted small">Role</td>
                  <td className="small text-capitalize">{user?.role}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-md-6">
          <div className="section-card h-100">
            <h6 className="mb-3">Security</h6>
            <p className="text-muted small">
              To change your password, we'll email you a secure reset link.
            </p>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={handleSendResetLink}
              disabled={isLoading}
            >
              <i className="bi bi-envelope me-1"></i>
              {isLoading ? "Sending..." : "Send Password Reset Link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
