import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { registerAdmin, resetAuthStatus } from "../../redux/slices/authSlice";
import Spinner from "../../components/Spinner";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading, isError, message } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (user?.token) {
      navigate(`/${user.role}/dashboard`, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(resetAuthStatus());
    }
  }, [isError, message, dispatch]);

  const onSubmit = (data) => {
    const { confirmPassword, ...payload } = data;
    dispatch(registerAdmin(payload));
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="text-center mb-4">
          <i className="bi bi-houses-fill fs-1 text-primary-custom"></i>
          <h4 className="mt-2 mb-0">Create Admin Account</h4>
          <p className="text-muted small">
            Only the society admin registers here. Other accounts (resident,
            security, maintenance) are created by the admin.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Full Name</label>
            <input
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              placeholder="Your name"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <div className="invalid-feedback">{errors.name.message}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Email</label>
            <input
              type="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="you@example.com"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email.message}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Phone</label>
            <input
              className="form-control"
              placeholder="9999999999"
              {...register("phone")}
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Password</label>
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
              placeholder="Re-enter password"
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
            {isLoading ? <Spinner small /> : "Create Admin Account"}
          </button>
        </form>

        <p className="text-center small text-muted mt-4 mb-0">
          Already have an account?{" "}
          <Link to="/login" className="text-decoration-none">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
