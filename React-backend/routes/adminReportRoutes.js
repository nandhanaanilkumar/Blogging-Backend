const express = require("express");
const router = express.Router();

const Report = require("../models/Report");
const Post = require("../models/post");
const Comment = require("../models/comment");

// GET REPORTED POSTS (FULL DATA)
router.get("/posts", async (req, res) => {
  try {

    // 1️⃣ get reports
    const reports = await Report.find({ type: "post" });

    // 2️⃣ extract post IDs
    const postIds = reports.map(r => r.targetId);

    // 3️⃣ fetch real posts
    const posts = await Post.find({
      _id: { $in: postIds }
    }).populate("userId", "firstName lastName profileImage");

    res.json(posts);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/comments", async (req, res) => {
  try {

    // 1️⃣ get reported comments
    const reports = await Report.find({
      type: "comment"
    });

    const commentIds = reports.map(r => r.targetId);

    // 2️⃣ fetch REAL comments
    const comments = await Comment.find({
      _id: { $in: commentIds }
    }).populate("userId");

    // 3️⃣ fetch related posts
    const finalData = [];

    for (const comment of comments) {

      const post = await Post.findById(comment.postId)
        .populate("userId");

      finalData.push({
        commentId: comment._id,
        commentText: comment.text,
        commentUser: comment.userId,
        postText: post?.text,
        postAuthor: post?.userId,
        createdAt: comment.createdAt
      });
    }

    res.json(finalData);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/comments/delete/:id", async (req, res) => {
  try {

    console.log("DELETE ID:", req.params.id);

    const deleted = await Comment.findByIdAndDelete(
      req.params.id
    );

    console.log("DELETED COMMENT:", deleted);

    await Report.updateMany(
  {
    type: "comment",
    targetId: String(req.params.id)
  },
      { status: "Resolved" }
    );

    res.json({ message: "Deleted" });

  } catch (err) {
    console.log("DELETE ERROR:", err); // ⭐ VERY IMPORTANT
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/comments/keep/:id", async (req, res) => {
  try {

    await Report.updateMany(
      {
        type: "comment",
        targetId: req.params.id
      },
      {
        status: "Resolved"
      }
    );

    res.json({ message: "Comment kept" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;