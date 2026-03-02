// routes/profile.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ProfileView = require("../models/ProfileView");
const Post = require("../models/post");
router.get("/profile-stats/:id", async (req, res) => {
  try {

    const userId = req.params.id;

    // 🔥 VERY IMPORTANT CHECK
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Invalid user ID received",
      });
    }

    const profileViewers = await ProfileView.countDocuments({
      profileId: userId,
    });

    const postImpressions = await Post.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$impressions" },
        },
      },
    ]);

    res.json({
      profileViewers,
      postImpressions: postImpressions[0]?.total || 0,
    });

  } catch (err) {
    console.error("PROFILE STATS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
router.post("/add-profile-view", async (req, res) => {
  try {

    const { profileId, viewerId } = req.body;

    // prevent self view
    if (profileId === viewerId) {
      return res.send();
    }

    await ProfileView.create({
      profileId,
      viewerId,
    });

    res.send("view added");

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;

// =============================