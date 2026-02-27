const express = require("express");
const router = express.Router();

const User = require("../models/user");

// GET ALL USERS
router.get("/", async (req, res) => {
  try {

    const users = await User.find()
      .select("firstName lastName email role status createdAt");

    res.json(users);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;