const express = require("express");
const router = express.Router();

const Post = require("../models/post");
const Like = require("../models/Like");
const Comment = require("../models/comment");


// =============================
// GET POSTS + SEARCH
// =============================
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";

   const posts = await Post.find({
  $and: [
    {
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }, // old posts
      ],
    },
    {
      $or: [
        { isHidden: false },
        { isHidden: { $exists: false } }, // old posts
      ],
    },
    {
      text: { $regex: search, $options: "i" },
    },
  ],
})
  .populate("userId", "firstName lastName profileImage")
  .sort({ updatedAt: -1 });

    // ⭐ add likes/comments
    const formatted = await Promise.all(
      posts.map(async (p) => ({
        ...p._doc,
        likes: await Like.countDocuments({ postId: p._id }),
        commentsCount: await Comment.countDocuments({
          postId: p._id,
        }),
      }))
    );

    res.status(200).json(formatted);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// =============================
// PREVIEW SINGLE POST
// =============================
router.get("/:id/preview", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("userId");

    if (!post)
      return res.status(404).json({ message: "Post not found" });

    res.status(200).json(post);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// =============================
// SOFT DELETE
// =============================
router.delete("/:id", async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
    });

    res.status(200).json({
      message: "Post deleted",
    });

  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});


// =============================
// HIDE POST
// =============================
router.patch("/:id/hide", async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, {
      isHidden: true,
    });

    res.status(200).json({
      message: "Post hidden",
    });

  } catch (error) {
    res.status(500).json({ message: "Hide failed" });
  }
});


// =============================
// WARN POST
// =============================
router.patch("/:id/warn", async (req, res) => {
  try {
    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { reports: 1 } },
      { new: true }
    );

    res.status(200).json({
      message: "Post warned",
      post: updated,
    });

  } catch (error) {
    res.status(500).json({ message: "Warn failed" });
  }
});

module.exports = router;