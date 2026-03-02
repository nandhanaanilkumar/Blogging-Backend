const mongoose = require("mongoose");

const profileViewSchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  viewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  viewedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ProfileView", profileViewSchema);