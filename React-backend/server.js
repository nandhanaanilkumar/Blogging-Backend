const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");


const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/blogApp")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


const LikeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  }
});

const NotificationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  message: String,
  isRead: Boolean,
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model("Post", PostSchema);
const Comment = mongoose.model("Comment", CommentSchema);
const Like = mongoose.model("Like", LikeSchema);
const Notification = mongoose.model("Notification", NotificationSchema);

const User = mongoose.model("User", UserSchema);


// Registration API
app.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.json({ message: "User registered successfully" });

  } catch (error) {
    console.log(error);  
    res.status(500).json({ message: "Server Error" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));

// Login API
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
