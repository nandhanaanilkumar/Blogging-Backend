const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  type: { type: String }, // "post" or "comment"
  targetId: String,
  reportedBy: String,
  reason: String,
  status: {
    type: String,
    default: "Pending",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Report", reportSchema);