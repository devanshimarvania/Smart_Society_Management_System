const nodemailer = require("nodemailer");

// Gmail SMTP transporter.
// IMPORTANT: EMAIL_PASS must be a Gmail "App Password" (16 characters),
// not your normal Gmail login password. Regular passwords will be rejected
// by Gmail once 2-Step Verification is enabled (which is required to
// generate an App Password in the first place).
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration on startup (logs only, does not crash app)
transporter.verify((error, success) => {
  if (error) {
    console.error("Nodemailer config error:", error.message);
  } else {
    console.log("Nodemailer is ready to send emails.");
  }
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"Smart Society Management" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
