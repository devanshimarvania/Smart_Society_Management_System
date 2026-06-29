const resetPasswordTemplate = (name, resetUrl) => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c3e50;">Smart Society Management</h2>
    <p>Hi ${name},</p>
    <p>You (or someone else) requested a password reset for your account.</p>
    <p>Click the button below to reset your password. This link is valid for 30 minutes.</p>
    <a href="${resetUrl}" 
       style="display: inline-block; padding: 12px 24px; margin: 16px 0; 
              background-color: #4f46e5; color: #ffffff; text-decoration: none; 
              border-radius: 6px; font-weight: bold;">
      Reset Password
    </a>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #555;">${resetUrl}</p>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;" />
    <p style="font-size: 12px; color: #999;">Smart Society Management System</p>
  </div>
  `;
};

module.exports = { resetPasswordTemplate };
