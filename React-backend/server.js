const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const Post = require("./models/post");
const User = require("./models/user");
const Comment = require("./models/Comment");
const Follow = require("./models/follow"); 
const Connection = require("./models/Connection");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/blogApp")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


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
    lastName: user.lastName,
    email: user.email,
    role: user.role
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/updateProfile/:id", async (req, res) => {
  try {

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select("-password");

    res.json(updatedUser);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});



app.get("/profile/:id", async (req, res) => {
  try {

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET Experiences
app.get("/experience/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.experiences || []);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD Experience
app.post("/experience/:id", async (req, res) => {
  try {
    const { role, company, duration, description } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.experiences.push({ role, company, duration, description });

    await user.save();

    res.json(user.experiences);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE Experience
app.put("/experience/:id/:index", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.experiences[req.params.index] = req.body;

    await user.save();

    res.json(user.experiences);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/createPost", async (req, res) => {
  try {

    const { userId, text, mediaUrl } = req.body;

    const newPost = new Post({
      userId,
      text,
      mediaUrl,
      isDraft: false
    });

    await newPost.save();

    res.json(newPost);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/posts", async (req, res) => {
  try {

    const posts = await Post.find()
      .populate("userId", "firstName lastName profileImage headline")
      .sort({ createdAt: -1 });

    res.json(posts);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
app.delete("/post/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/draft", async (req, res) => {
  try {

    const { userId, text, mediaUrl } = req.body;

    const draft = new Post({
      userId,
      text,
      mediaUrl,
      isDraft: true
    });

    await draft.save();

    res.json(draft);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/drafts/:userId", async (req, res) => {
  try {

    const drafts = await Post.find({
      userId: req.params.userId,
      isDraft: true
    }).sort({ createdAt: -1 });

    res.json(drafts);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
app.put("/publish/:id", async (req, res) => {
  try {

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { isDraft: false },
      { new: true }
    );

    res.json(post);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
app.delete("/draft/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Draft deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/userPosts/:userId", async (req, res) => {
  try {

    const posts = await Post.find({
      userId: req.params.userId,
      isDraft: false   // show only published posts
    })
      .populate("userId", "firstName lastName profileImage headline")
      .sort({ createdAt: -1 });

    res.json(posts);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/like", async (req, res) => {
  try {

    const { userId, postId } = req.body;

    const newLike = new Like({
      userId,
      postId
    });

    await newLike.save();

    res.json(newLike);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


app.post("/connect", async (req, res) => {
  
  try {

    const { senderId, receiverId } = req.body;

    const existing = await Connection.findOne({
      sender: senderId,
      receiver: receiverId
    });

    if (existing) {
      return res.json({ message: "Already requested" });
    }

    const newConnection = new Connection({
      sender: senderId,
      receiver: receiverId
    });

    await newConnection.save();

    res.json(newConnection);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/invitations/:userId", async (req, res) => {
  try {

    const invitations = await Connection.find({
      receiver: req.params.userId,
      status: "pending"
    }).populate({
  path: "sender",
  select: "firstName lastName headline profileImage role",
  match: { role: { $ne: "admin" } } // ⭐ filter admin
});
const filteredInvitations = invitations.filter(inv => inv.sender !== null);
    res.json(filteredInvitations);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
app.put("/accept/:id", async (req, res) => {
  try {

    const connection = await Connection.findByIdAndUpdate(
      req.params.id,
      { status: "accepted" },
      { new: true }
    );

    res.json(connection);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/connections/:userId", async (req, res) => {
  try {

    const connections = await Connection.find({
      $or: [
        { sender: req.params.userId, status: "accepted" },
        { receiver: req.params.userId, status: "accepted" }
      ]
    }).populate("sender receiver", "firstName lastName");

    res.json(connections);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/users/:currentUserId", async (req, res) => {
  try {

    const users = await User.find({
      _id: { $ne: req.params.currentUserId },
      role: { $ne: "admin" }
    }).select("firstName lastName headline profileImage role");

    res.json(users);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
app.delete("/ignore/:id", async (req, res) => {
  try {

    await Connection.findByIdAndDelete(req.params.id);

    res.json({ message: "Ignored" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/people/:userId", async (req, res) => {
  try {

    const userId = req.params.userId;

    // get all connections
    const connections = await Connection.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    });

    const excludedIds = connections.flatMap(c => [
      c.sender.toString(),
      c.receiver.toString()
    ]);

    excludedIds.push(userId);

    const people = await User.find({
  _id: { $nin: excludedIds },
  role: { $ne: "admin" }   
}).select("firstName lastName headline profileImage role");



    res.json(people);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/mutual/:userId/:otherId", async (req, res) => {

  const a = await Connection.find({
    $or: [
      { sender: req.params.userId, status: "accepted" },
      { receiver: req.params.userId, status: "accepted" }
    ]
  });

  const b = await Connection.find({
    $or: [
      { sender: req.params.otherId, status: "accepted" },
      { receiver: req.params.otherId, status: "accepted" }
    ]
  });

  const mutual = a.filter(x =>
    b.some(y =>
      x.sender.equals(y.sender) ||
      x.receiver.equals(y.receiver)
    )
  );

  res.json({ mutual: mutual.length });
});

app.get("/followers/:userId", async (req, res) => {
  try {
    const followers = await Connection.find({
      receiver: req.params.userId,
      status: "accepted"
    }).populate(
      "sender",
      "firstName lastName profileImage headline"
    );

    res.json(followers);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/following/:userId", async (req, res) => {
  try {
    const following = await Connection.find({
      sender: req.params.userId,
      status: "accepted"
    }).populate(
      "receiver",
      "firstName lastName profileImage headline"
    );

    res.json(following);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/feed/:userId", async (req, res) => {
  try {

    const userId = req.params.userId;

    // STEP 1 — Get all accepted connections
    const connections = await Connection.find({
      $or: [
        { sender: userId, status: "accepted" },
        { receiver: userId, status: "accepted" }
      ]
    });

    // STEP 2 — extract connected user IDs
    const connectedIds = connections.map(c =>
      c.sender.toString() === userId
        ? c.receiver
        : c.sender
    );

    // include user's own posts
    connectedIds.push(userId);

    // STEP 3 — fetch posts from connected users
    const feedPosts = await Post.find({
      userId: { $in: connectedIds },
      isDraft: false
    })
      .populate("userId", "firstName lastName profileImage headline")
      .sort({ createdAt: -1 });

    res.json(feedPosts);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});
app.listen(5000, () => console.log("Server running on port 5000"));
