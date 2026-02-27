const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({

  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    default: null,
  },

  type: {
    type: String,
    enum: ["like", "comment", "post"],
  },

  message: String,

  isRead: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", NotificationSchema);