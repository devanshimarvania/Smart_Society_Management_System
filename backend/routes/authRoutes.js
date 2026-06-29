const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  login,
  getMe,
  createUser,
  listUsers,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

// Public routes
router.post("/register", registerAdmin);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:resetToken", resetPassword);

// Private routes (any logged-in user)
router.get("/me", protect, getMe);

// Admin-only route - create Resident / Security / Maintenance accounts
router.post("/create-user", protect, authorize("admin"), createUser);

// Admin-only route - list users, optionally filtered by role
router.get("/users", protect, authorize("admin"), listUsers);

module.exports = router;
