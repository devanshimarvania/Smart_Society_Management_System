import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { forgotPassword, resetAuthStatus } from "../../redux/slices/authSlice";
import Spinner from "../../components/Spinner";

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.auth
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

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

  const onSubmit = (data) => {
    dispatch(forgotPassword(data));
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="text-center mb-4">
          <i className="bi bi-key fs-1 text-primary-custom"></i>
          <h4 className="mt-2 mb-0">Forgot Password</h4>
          <p className="text-muted small">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
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

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isLoading}
          >
            {isLoading ? <Spinner small /> : "Send Reset Link"}
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

export default ForgotPassword;
