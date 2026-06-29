import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { resetPassword, resetAuthStatus } from "../../redux/slices/authSlice";
import Spinner from "../../components/Spinner";

const ResetPassword = () => {
  const { resetToken } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.auth
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (isSuccess && user?.token) {
      toast.success("Password reset successful! Redirecting...");
      setTimeout(() => navigate(`/${user.role}/dashboard`), 1000);
      dispatch(resetAuthStatus());
    }
    if (isError && message) {
      toast.error(message);
      dispatch(resetAuthStatus());
    }
  }, [isSuccess, isError, user, message, dispatch, navigate]);

  const onSubmit = (data) => {
    dispatch(resetPassword({ resetToken, password: data.password }));
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="text-center mb-4">
          <i className="bi bi-shield-lock fs-1 text-primary-custom"></i>
          <h4 className="mt-2 mb-0">Reset Password</h4>
          <p className="text-muted small">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">New Password</label>
            <input
              type="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              placeholder="At least 6 characters"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Minimum 6 characters" },
              })}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password.message}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">
              Confirm Password
            </label>
            <input
              type="password"
              className={`form-control ${
                errors.confirmPassword ? "is-invalid" : ""
              }`}
              placeholder="Re-enter new password"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === watch("password") || "Passwords do not match",
              })}
            />
            {errors.confirmPassword && (
              <div className="invalid-feedback">
                {errors.confirmPassword.message}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isLoading}
          >
            {isLoading ? <Spinner small /> : "Reset Password"}
          </button>
        </form>

        <p className="text-center small text-muted mt-4 mb-0">
          <Link to="/login" className="text-decoration-none">
            <i className="bi bi-arrow-left"></i> Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
