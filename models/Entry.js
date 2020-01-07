const mongoose = require("mongoose");

const EntrySchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, "Please enter a subject"],
    trim: true,
    maxlength: [100, "Subject can not be more than 100 characters"]
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
    maxlength: [1000, "Description can not be more than 1000 characters"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  editedAt: {
    type: Date,
    required: false
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  }
});

module.exports = mongoose.model("Entry", EntrySchema);
