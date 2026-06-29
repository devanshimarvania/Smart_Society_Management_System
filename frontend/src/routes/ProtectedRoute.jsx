import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

// Wraps protected routes. If `allowedRoles` is provided, only those roles
// may access the nested routes - others are redirected to their own dashboard.
const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
