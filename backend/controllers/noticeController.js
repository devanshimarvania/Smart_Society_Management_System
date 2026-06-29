const Notice = require("../models/Notice");

// @desc    Create a notice
// @route   POST /api/notices
// @access  Private (admin only)
const createNotice = async (req, res, next) => {
  try {
    const { title, content, category, isPinned, expiresAt } = req.body;

    if (!title || !content) {
      res.statusCode = 400;
      throw new Error("title and content are required");
    }

    const attachment = req.file ? `/uploads/${req.file.filename}` : "";

    const notice = await Notice.create({
      title,
      content,
      category,
      postedBy: req.user._id,
      attachment,
      isPinned: isPinned || false,
      expiresAt: expiresAt || null,
    });

    res.status(201).json({
      success: true,
      message: "Notice posted successfully",
      notice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active notices (excludes expired ones automatically for non-admins)
// @route   GET /api/notices?category=event
// @access  Private (any logged-in role)
const getNotices = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;

    // Non-admins shouldn't see expired notices
    if (req.user.role !== "admin") {
      filter.$or = [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }];
    }

    const notices = await Notice.find(filter)
      .populate("postedBy", "name role")
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notices.length,
      notices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single notice by ID
// @route   GET /api/notices/:id
// @access  Private (any logged-in role)
const getNoticeById = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id).populate(
      "postedBy",
      "name role"
    );

    if (!notice) {
      res.statusCode = 404;
      throw new Error("Notice not found");
    }

    res.status(200).json({
      success: true,
      notice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a notice
// @route   PUT /api/notices/:id
// @access  Private (admin only)
const updateNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      res.statusCode = 404;
      throw new Error("Notice not found");
    }

    const { title, content, category, isPinned, expiresAt } = req.body;

    if (title) notice.title = title;
    if (content) notice.content = content;
    if (category) notice.category = category;
    if (isPinned !== undefined) notice.isPinned = isPinned;
    if (expiresAt !== undefined) notice.expiresAt = expiresAt;
    if (req.file) notice.attachment = `/uploads/${req.file.filename}`;

    await notice.save();

    res.status(200).json({
      success: true,
      message: "Notice updated successfully",
      notice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private (admin only)
const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      res.statusCode = 404;
      throw new Error("Notice not found");
    }

    await notice.deleteOne();

    res.status(200).json({
      success: true,
      message: "Notice deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
};
