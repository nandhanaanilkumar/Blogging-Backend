const express = require("express");
const router = express.Router();

const User = require("../models/user");
const Post = require("../models/Post");
const Comment = require("../models/comment");
const Report = require("../models/Report");

// GET ADMIN STATS
router.get("/", async (req, res) => {
  try {

    const usersCount = await User.countDocuments();
    const postsCount = await Post.countDocuments();
    const commentsCount = await Comment.countDocuments();

    // only pending reports
    const reportsCount = await Report.countDocuments({
      status: "Pending"
    });

    res.json({
      users: usersCount,
      posts: postsCount,
      comments: commentsCount,
      reports: reportsCount
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;