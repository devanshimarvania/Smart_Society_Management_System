const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../config/mail");
const { resetPasswordTemplate } = require("../utils/emailTemplates");

// @desc    Register a new ADMIN account (public self-registration)
// @route   POST /api/auth/register
// @access  Public
// NOTE: This endpoint only ever creates "admin" role accounts.
// Resident / Security / Maintenance accounts must be created by an
// existing admin via POST /api/auth/create-user (see below).
const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.statusCode = 400;
      throw new Error("Name, email, and password are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.statusCode = 400;
      throw new Error("An account with this email already exists");
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: "admin",
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login for all roles (admin, resident, security, maintenance)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.statusCode = 400;
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.statusCode = 401;
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      res.statusCode = 403;
      throw new Error("Your account has been deactivated. Contact admin.");
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.statusCode = 401;
      throw new Error("Invalid email or password");
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged-in user's profile
// @route   GET /api/auth/me
// @access  Private (any logged-in role)
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin creates a Resident / Security / Maintenance account
// @route   POST /api/auth/create-user
// @access  Private (admin only)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !role) {
      res.statusCode = 400;
      throw new Error("Name, email, password, and role are required");
    }

    const allowedRoles = ["resident", "security", "maintenance"];
    if (!allowedRoles.includes(role)) {
      res.statusCode = 400;
      throw new Error(
        `Invalid role. Admin can only create users with role: ${allowedRoles.join(", ")}`
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.statusCode = 400;
      throw new Error("An account with this email already exists");
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `${role} account created successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin lists users, optionally filtered by role (e.g. to populate
//          a "assign to maintenance staff" dropdown when assigning complaints)
// @route   GET /api/auth/users?role=maintenance
// @access  Private (admin only)
const listUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const users = await User.find(filter)
      .select("name email phone role isActive createdAt")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - generates reset token and emails reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.statusCode = 400;
      throw new Error("Email is required");
    }

    const user = await User.findOne({ email });

    // For security, don't reveal whether the email exists or not
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a reset link has been sent",
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request - Smart Society Management",
        html: resetPasswordTemplate(user.name, resetUrl),
      });

      res.status(200).json({
        success: true,
        message: "If an account with that email exists, a reset link has been sent",
      });
    } catch (emailError) {
      // Roll back the token if email fails to send
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("Email send error:", emailError.message);
      res.statusCode = 500;
      throw new Error("Email could not be sent. Please try again later.");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token from email link
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      res.statusCode = 400;
      throw new Error("Password must be at least 6 characters");
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpire");

    if (!user) {
      res.statusCode = 400;
      throw new Error("Invalid or expired reset token");
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerAdmin,
  login,
  getMe,
  createUser,
  listUsers,
  forgotPassword,
  resetPassword,
};
