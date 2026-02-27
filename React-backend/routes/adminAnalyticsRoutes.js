const express = require("express");
const router = express.Router();

const User = require("../models/user");
const Post = require("../models/Post");
const Comment = require("../models/comment");
const Report = require("../models/Report");

router.get("/", async (req, res) => {
  try {
    const users = await User.countDocuments();
    const posts = await Post.countDocuments();
    const comments = await Comment.countDocuments();

    const reports = await Report.countDocuments({
      status: "Pending"
    });

    // engagement
    const allPosts = await Post.find();

    const totalLikes = allPosts.reduce(
      (sum, p) => sum + (p.likesCount || 0),
      0
    );

    const avgLikes =
      posts > 0 ? (totalLikes / posts).toFixed(1) : 0;

    const avgComments =
      posts > 0 ? (comments / posts).toFixed(1) : 0;

    res.json({
      users,
      posts,
      comments,
      reports,
      avgLikes,
      avgComments
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;