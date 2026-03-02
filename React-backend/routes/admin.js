const express = require("express");
const router = express.Router();

const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");

router.get("/analytics", async (req, res) => {
  try {
    // ===== BASIC COUNTS =====
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();

    // ===== ACTIVE USERS (example: last 7 days) =====
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = await User.countDocuments({
      updatedAt: { $gte: sevenDaysAgo },
    });

    // ===== USER GROWTH (MONTHLY) =====
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          users: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ===== POSTS PER MONTH =====
    const postsPerMonth = await Post.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          posts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const weeklyEngagement = await Post.aggregate([
  {
    $group: {
      _id: { $dayOfWeek: "$createdAt" },
      engagement: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
]);

// ===== TOP ACTIVE USERS =====
const topUsers = await Post.aggregate([
  {
    $group: {
      _id: "$userId",      // group by user
      posts: { $sum: 1 },  // count posts
    },
  },
  { $sort: { posts: -1 } }, // highest first
  { $limit: 5 },            // top 5 users
  {
    $lookup: {
      from: "users",        // MongoDB collection name
      localField: "_id",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: "$user" },
  {
    $project: {
      _id: 0,
      name: {
        $concat: ["$user.firstName", " ", "$user.lastName"],
      },
      posts: 1,
    },
  },
]);

const days = ["", "Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const formattedWeekly = weeklyEngagement.map(d => ({
  day: days[d._id],
  engagement: d.engagement,
}));
    // Convert month number → name
    const months = [
      "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const formattedUserGrowth = userGrowth.map((item) => ({
      month: months[item._id],
      users: item.users,
    }));

    const formattedPosts = postsPerMonth.map((item) => ({
      month: months[item._id],
      posts: item.posts,
    }));
    res.json({
      totalUsers,
      totalPosts,
      totalComments,
     activeUsers,
     topUsers,  
      userGrowth: formattedUserGrowth,
      postsPerMonth: formattedPosts,
      weeklyEngagement: formattedWeekly,

    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;