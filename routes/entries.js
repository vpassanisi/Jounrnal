const express = require("express");
const {
  createEntry,
  deleteEntry,
  getAllEntries,
  getEntry,
  updateEntry
} = require("../controllers/entries");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .post(protect, createEntry)
  .get(protect, getAllEntries);

router
  .route("/:entryid")
  .get(protect, getEntry)
  .delete(protect, deleteEntry)
  .put(protect, updateEntry);

module.exports = router;
