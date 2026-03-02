const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  text: String,
  tags: [String],
  mediaUrl: String,

  isDraft: {
    type: Boolean,
    default: false
  },
isDeleted: {
      type: Boolean,
      default: false,
    },

    isHidden: {
      type: Boolean,
      default: false,
    },

    reports: {
      type: Number,
      default: 0,
    },

    warningCount: {
      type: Number,
      default: 0,
    },
    impressions: {
  type: Number,
  default: 0,
}
},
 {
    timestamps: true, // ⭐ IMPORTANT
  }
);

module.exports = mongoose.model("Post", PostSchema);
