const express = require("express");
const router = express.Router();
const Report = require("../models/Report");


// REPORT POST
router.post("/post", async (req, res) => {
  const { userId, postId } = req.body;

  await Report.create({
    type: "post",
    targetId: postId,
    reportedBy: userId,
    reason: "Reported by user",
  });

  res.json({ message: "Post reported" });
});


// REPORT COMMENT
router.post("/comment", async (req, res) => {
  const { userId, commentId } = req.body;

  await Report.create({
    type: "comment",
    targetId: commentId,
    reportedBy: userId,
    reason: "Reported by user",
  });

  res.json({ message: "Comment reported" });
});

module.exports = router;