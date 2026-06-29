// Role-based access control middleware.
// Usage: router.post("/route", protect, authorize("admin"), controllerFn)
// Must be used AFTER the `protect` middleware, since it relies on req.user.
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, please login first",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not permitted to perform this action`,
      });
    }

    next();
  };
};

module.exports = { authorize };
