const multer = require("multer");
const upload = require("../config/multer");

// Wraps a multer upload call so multer-specific errors (file too large,
// wrong file type, etc.) are converted into our standard JSON error format
// instead of crashing or returning multer's raw error.
const uploadSingle = (fieldName) => (req, res, next) => {
  const handler = upload.single(fieldName);

  handler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      let message = "File upload error";
      if (err.code === "LIMIT_FILE_SIZE") {
        message = "File size must be under 5MB";
      }
      return res.status(400).json({ success: false, message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

const uploadMultiple = (fieldName, maxCount = 5) => (req, res, next) => {
  const handler = upload.array(fieldName, maxCount);

  handler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      let message = "File upload error";
      if (err.code === "LIMIT_FILE_SIZE") {
        message = "Each file size must be under 5MB";
      } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
        message = `You can upload a maximum of ${maxCount} files`;
      }
      return res.status(400).json({ success: false, message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

module.exports = { uploadSingle, uploadMultiple };
