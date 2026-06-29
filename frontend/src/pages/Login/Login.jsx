import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login, resetAuthStatus } from "../../redux/slices/authSlice";
import Spinner from "../../components/Spinner";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading, isError, message } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
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
    dispatch(login(data));
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="text-center mb-4">
          <i className="bi bi-houses-fill fs-1 text-primary-custom"></i>
          <h4 className="mt-2 mb-0">Smart Society</h4>
          <p className="text-muted small">Sign in to your account</p>
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

          <div className="mb-2">
            <label className="form-label small fw-semibold">Password</label>
            <input
              type="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              placeholder="••••••••"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password.message}</div>
            )}
          </div>

          <div className="text-end mb-3">
            <Link to="/forgot-password" className="small text-decoration-none">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isLoading}
          >
            {isLoading ? <Spinner small /> : "Login"}
          </button>
        </form>

        <p className="text-center small text-muted mt-4 mb-0">
          Society admin?{" "}
          <Link to="/register" className="text-decoration-none">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
