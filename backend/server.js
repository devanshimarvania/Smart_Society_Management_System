require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Routes
const authRoutes = require("./routes/authRoutes");
const flatRoutes = require("./routes/flatRoutes");
const residentRoutes = require("./routes/residentRoutes");
const familyMemberRoutes = require("./routes/familyMemberRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const visitorRoutes = require("./routes/visitorRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const billRoutes = require("./routes/billRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const facilityRoutes = require("./routes/facilityRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const pollRoutes = require("./routes/pollRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");

// Connect to MongoDB
connectDB();

const app = express();

// Core middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files (images, etc.) statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Society Management System API is running",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/flats", flatRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/family-members", familyMemberRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

// 404 handler (for unknown routes)
app.use(notFound);

// Centralized error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
