const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const Entry = require("../models/Entry");

// @desc  Get all entries of a user
// @route  GET /api/v1/entries/
// @access  Private
exports.getAllEntries = asyncHandler(async (req, res, next) => {
  if (!req.user.id) {
    return next(
      new ErrorResponse(`Must be logged in to get journal entries`, 401)
    );
  }

  const entries = await Entry.find({ user: req.user.id });

  if (!entries) {
    return next(
      new ErrorResponse(`Entry not found with id of ${req.user.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: entries
  });
});

// @desc  Get single entry
// @route  GET /api/v1/entries/:entryid
// @access  Private
exports.getEntry = asyncHandler(async (req, res, next) => {
  const entry = await Entry.findById(req.params.entryid);

  if (!entry) {
    return next(
      new ErrorResponse(`Entry not found with id of ${req.params.entryid}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: entry
  });
});

// @desc  Add new journal entry
// @route  POST /api/v1/entries
// @access  Private
exports.createEntry = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;

  const entry = await Entry.create(req.body);

  res.status(200).json({
    success: true,
    data: entry
  });
});

// @desc  Update entry
// @route  PUT /api/v1/entries/:entryid
// @access  Private
exports.updateEntry = asyncHandler(async (req, res, next) => {
  let entry = await Entry.findById(req.params.entryid);

  if (!entry) {
    return next(
      new ErrorResponse(`Entry not ofund with id of ${req.params.entryid}`, 404)
    );
  }

  if (entry.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this entry`,
        401
      )
    );
  }

  req.body.editedAt = new Date();

  entry = await Entry.findByIdAndUpdate(req.params.entryid, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  });

  res.status(200).json({
    success: true,
    data: entry
  });
});

// @desc  Delete journal entry
// @route  DELETE /api/v1/entries/:id
// @access  Private
exports.deleteEntry = asyncHandler(async (req, res, next) => {
  const entry = await Entry.findById(req.params.entryid);

  if (!entry) {
    return next(
      new ErrorResponse(`Entry not found with id of ${req.params.id}`, 404)
    );
  }

  if (entry.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to delete this entry`,
        401
      )
    );
  }

  entry.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});
