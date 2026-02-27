const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

// GET ALL POSTS
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().populate("userId");
    res.json(posts);
  } catch (error) {
    console.log("ADMIN POSTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// SOFT DELETE
router.put("/delete/:id", async (req, res) => {
  await Post.findByIdAndUpdate(req.params.id, {
    status: "Deleted",
  });
  res.json({ message: "Post deleted" });
});

// HIDE POST
router.put("/hide/:id", async (req, res) => {
  await Post.findByIdAndUpdate(req.params.id, {
    status: "Hidden",
  });
  res.json({ message: "Post hidden" });
});

// WARN
router.put("/warn/:id", async (req, res) => {
  await Post.findByIdAndUpdate(req.params.id, {
    $inc: { reports: 1 },
  });
  res.json({ message: "Post warned" });
});

module.exports = router;