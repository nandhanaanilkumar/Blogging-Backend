const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Post = require("./models/post");
const User = require("./models/user");
const Comment = require("./models/comment");
const Follow = require("./models/follow"); 
const Connection = require("./models/Connection");
const Like = require("./models/Like");
const Notification = require("./models/Notification");
const Conversation = require("./models/Conversation");
const Message = require("./models/Message");
const Report = require("./models/Report");
const Save = require("./models/Save");
const adminPostRoutes = require("./routes/adminPostRoutes");
const adminStatsRoutes = require("./routes/adminStatsRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");  
const adminRoutes = require("./routes/admin");
const profileRoutes = require("./routes/profile");
const ProfileView = require("./models/ProfileView");
const app = express();
const nodemailer=require("nodemailer");
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/report", require("./routes/reportRoutes"));
app.use("/admin/reports", require("./routes/adminReportRoutes"));
app.use("/admin/posts", adminPostRoutes);
app.use("/admin/stats", adminStatsRoutes);
app.use("/admin/users", adminUserRoutes);
app.use("/admin", adminRoutes);
app.use("/", profileRoutes);
let otpStore={};
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

  const user = await User.findById(req.params.id);

  const posts = await Post.find({
    userId: req.params.id
  }).sort({ createdAt: -1 });

  const followers = await Follow.countDocuments({
    receiver: req.params.id,
  });

  const following = await Follow.countDocuments({
    sender: req.params.id,
  });

  res.json({
    ...user.toObject(),
    posts,
    followers,
    following
  });
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
  const tags =
    text.match(/#\w+/g)?.map(t => t.toLowerCase()) || [];
    const newPost = new Post({
      userId,
      text,
      mediaUrl,
      isDraft: false
    });

    await newPost.save();

    res.json(newPost);
const followers = await Connection.find({
  receiver: userId,
  status: "accepted"
});

for (let f of followers) {
  await Notification.create({
    receiverId: f.sender,
    senderId: userId,
    postId: newPost._id,
    type: "post",
    message: "published a new post",
  });
}
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/posts", async (req, res) => {
  try {

    const posts = await Post.find({
     isDeleted: { $ne: true },
  isHidden: { $ne: true },
    })
      .populate("userId", "firstName lastName profileImage headline")
      .sort({ updatedAt: -1 });

    res.json(posts);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
app.delete("/post/:id/:userId", async (req, res) => {
  try {

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    // ⭐ owner check
    if (post.userId.toString() !== req.params.userId) {
      return res.status(403).json({
        message: "Not allowed"
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted successfully" });

  } catch (err) {
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
app.post("/draft", async (req, res) => {
  try {

    const { userId, text, mediaUrl } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const draft = new Post({
      userId,
      text,
      mediaUrl,
      isDraft: true
    });

    await draft.save();

    res.json(draft);

  } catch (error) {
    console.log("Draft error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/userPosts/:userId", async (req, res) => {
  try {

    const posts = await Post.find({
      userId: req.params.userId,
      isDraft: false,
      isDeleted: { $ne: true }, // ⭐ ADD
  isHidden: { $ne: true }, 
    })
      .populate("userId",
        "firstName lastName profileImage headline")
      .sort({ createdAt: -1 });

    const formatted = await Promise.all(

      posts.map(async (post) => {

        const likesCount =
          await Like.countDocuments({
            postId: post._id
          });

        const commentsCount =
          await Comment.countDocuments({
            postId: post._id
          });

        const savesCount =
          await Save.countDocuments({
            postId: post._id
          });

        return {
          ...post.toObject(),
          likesCount,
          commentsCount,
          savesCount,
        };
      })
    );

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/like", async (req, res) => {
  try {

    const { userId, postId } = req.body;

    // check if already liked
    const existing = await Like.findOne({
      userId,
      postId,
    });

    if (existing) {
      await Like.deleteOne({ _id: existing._id });
    } else {

      // ⭐ LIKE CREATED
      await Like.create({
        userId,
        postId,
      });

      // ⭐ ADD THIS PART HERE ↓↓↓
      const post = await Post.findById(postId);

      if (post.userId.toString() !== userId) {
        await Notification.create({
          receiverId: post.userId,
          senderId: userId,
          postId,
          type: "like",
          message: "liked your post",
        });
      }
      // ⭐ END
    }

    const likesCount =
  await Like.countDocuments({ postId });

res.json({
  likesCount,
  liked: !existing
});

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/connect", async (req, res) => {
  try {

    const { senderId, receiverId } = req.body;

    // Prevent duplicate requests in both directions
    const existing = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (existing) {
      return res.json({ message: "Already requested" });
    }

    const newConnection = new Connection({
      sender: senderId,
      receiver: receiverId,
      status: "pending"
    });

    await newConnection.save();

    // ⭐ CREATE NOTIFICATION
    await Notification.create({
      receiverId: receiverId,
      senderId: senderId,
      type: "connection",
      message: "sent you a connection request"
    });

    res.json(newConnection);

  } catch (error) {
    console.log(error);
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

    console.log("Connection accepted:", connection);

    const notification = await Notification.create({
      receiverId: connection.sender,
      senderId: connection.receiver,
      type: "connection",
      message: "accepted your connection request"
    });

    console.log("Notification created:", notification);

    res.json(connection);

  } catch (error) {
    console.log(error);
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
}).select("firstName lastName headline profileImage backgroundImage role");



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

    // STEP 1 — accepted connections
    const connections = await Connection.find({
      $or: [
        { sender: userId, status: "accepted" },
        { receiver: userId, status: "accepted" }
      ]
    });

    
    const connectedIds = connections.map(c =>
      c.sender.toString() === userId
        ? c.receiver
        : c.sender
    );

    connectedIds.push(userId);

    const feedPosts = await Post.find({
  userId: { $in: connectedIds },
  isDraft: false,
  isDeleted: { $ne: true }, 
  isHidden: { $ne: true },  
})
  .populate("userId", "firstName lastName profileImage headline")
  .sort({ createdAt: -1 });

    const postsWithDetails = await Promise.all(

      feedPosts.map(async (post) => {

        const likes = await Like.countDocuments({
          postId: post._id
        });

        const likedByMe = await Like.findOne({
          postId: post._id,
          userId: userId
        });

        const comments = await Comment.find({
          postId: post._id
        })
          .populate("userId", "firstName lastName profileImage")
          .sort({ createdAt: -1 });

        return {
          ...post.toObject(),
          likesCount: likes,
          isLiked: !!likedByMe,
          comments
        };
      })
    );

    res.json(postsWithDetails);

  } catch (error) {
  console.log("FEED ERROR:", error);
  res.status(500).json({ message: "Server error", error });
}
});
app.post("/comment", async (req, res) => {
  try {

    const { userId, postId, text } = req.body;

    const comment = await Comment.create({
      userId,
      postId,
      text
    });

    const populated = await comment.populate(
      "userId",
      "firstName lastName profileImage"
    );
const post = await Post.findById(postId);

if (post.userId.toString() !== userId) {
  await Notification.create({
    receiverId: post.userId,
    senderId: userId,
    postId,
    type: "comment",
    message: `commented: "${text}"`,
  });
}
    res.json(populated);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/notifications/:userId", async (req, res) => {
  try {

    const notifications = await Notification.find({
      receiverId: req.params.userId
    })
      .populate("senderId", "firstName lastName profileImage")
      .sort({ createdAt: -1 });

    res.json(notifications);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/conversation", async (req, res) => {

  const { senderId, receiverId } = req.body;

  let convo = await Conversation.findOne({
    members: { $all: [senderId, receiverId] }
  });

  if (!convo) {
    convo = await Conversation.create({
      members: [senderId, receiverId]
    });
  }

  res.json(convo);
});

app.post("/message", async (req, res) => {
  try {

    const { conversationId, sender, text } = req.body;

    // ⭐ 1. create new message
    const msg = await Message.create({
      conversationId,
      sender,
      text,
    });

    // ⭐ 2. update conversation last message
    await Conversation.findByIdAndUpdate(
      conversationId,
      { lastMessage: text }
    );

    // ⭐ 3. send response
    res.json(msg);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/messages/:conversationId", async (req, res) => {

  const messages = await Message.find({
    conversationId: req.params.conversationId
  })
    .populate("sender", "firstName profileImage")
    .sort({ createdAt: 1 });

  res.json(messages);
});

app.get("/conversations/:userId", async (req, res) => {

  const convos = await Conversation.find({
    members: req.params.userId
  }).populate("members", "firstName profileImage");

  res.json(convos);
});


app.get("/updates/:userId", async (req, res) => {
  try {

    const userId = req.params.userId;

    const newNotifications = await Notification.countDocuments({
      receiverId: userId,
      isRead: false
    });

    const newMessages = await Message.countDocuments({
      receiver: userId,
      isRead: false
    });

    const newNetwork = await Connection.countDocuments({
      receiver: userId,
      status: "pending"
    });

    // example logic for new posts
    const newPosts = await Post.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 86400000) } // last 24h
    });

    res.json({
      newPosts,
      newMessages,
      newNotifications,
      newNetwork,
    });

  } catch (err) {
    res.status(500).json({ message: "error" });
  }
});

app.get("/search", async (req, res) => {
  try {

    const text = req.query.text || "";

    const users = await User.find({
      $or: [
        { firstName: { $regex: text, $options: "i" } },
        { lastName: { $regex: text, $options: "i" } },
        { headline: { $regex: text, $options: "i" } }
      ]
    }).select("firstName lastName profileImage headline");

    const posts = await Post.find({
      text: { $regex: text, $options: "i" }
    }).populate("userId","firstName lastName profileImage");

    res.json({ users, posts });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/search/messages/:userId", async (req, res) => {
  try {

    const { userId } = req.params;
    const text = req.query.text || "";

    // ⭐ existing conversations
    const conversations = await Conversation.find({
      members: userId,
    }).populate("members", "firstName lastName profileImage");

    const matchedChats = conversations
      .map(c => {

        const other = c.members.find(
          m => m._id.toString() !== userId
        );

        if (!other) return null;

        const full =
          `${other.firstName} ${other.lastName}`.toLowerCase();

        if (!full.includes(text.toLowerCase())) return null;

        return {
          conversationId: c._id,
          user: other,
          lastMessage: c.lastMessage || "",
          isConnected: true, // already chatting
        };
      })
      .filter(Boolean);

    // ⭐ users not chatted
    const chattedIds = conversations.flatMap(c =>
      c.members.map(m => m._id.toString())
    );

    const users = await User.find({
      _id: { $nin: chattedIds },
      $or: [
        { firstName: { $regex: text, $options: "i" } },
        { lastName: { $regex: text, $options: "i" } },
      ],
      role: { $ne: "admin" }
    }).select("firstName lastName profileImage headline");

    // ⭐ check connection status
    const formattedUsers = await Promise.all(
      users.map(async (u) => {

        const connection = await Connection.findOne({
          $or: [
            {
              sender: userId,
              receiver: u._id,
              status: "accepted",
            },
            {
              sender: u._id,
              receiver: userId,
              status: "accepted",
            },
          ],
        });

        return {
          ...u._doc,
          isConnected: !!connection,
        };
      })
    );

    res.json({
      chats: matchedChats,
      users: formattedUsers,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/relationship/:viewerId/:profileId", async (req, res) => {

  const { viewerId, profileId } = req.params;

  const connection = await Connection.findOne({
    $or: [
      { sender: viewerId, receiver: profileId },
      { sender: profileId, receiver: viewerId }
    ]
  });

  if (connection?.status === "accepted") {
    return res.json({ type: "connected" });
  }

  if (connection?.status === "pending") {
    if (connection.sender.toString() === viewerId) {
      return res.json({ type: "pending_sent" });
    } else {
      return res.json({ type: "pending_received" });
    }
  }

  res.json({ type: "none" });
});

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 3 * 60 *1000, // 60 seconds
  };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "bca2427@rajagiri.edu",
      pass: "fjjb atbn ithq qufa",
    },
  });

  await transporter.sendMail({
    from: "bca2427@rajagiri.edu",
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP is: ${otp}`,
  });

  res.json({ message: "OTP sent successfully" });
});
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore[email];

  if (!record) {
    return res.status(400).json({ message: "No OTP found" });
  }

  if (Date.now() > record.expiresAt) {
    return res.status(400).json({ message: "OTP expired" });
  }

  if (record.otp != otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // ⭐ mark verified
  otpStore[email].verified = true;

  res.json({ success: true });
});

const bcrypt = require("bcryptjs");

app.post("/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    const record = otpStore[email];

    // ❌ block if OTP not verified
    if (!record || !record.verified) {
      return res.status(400).json({
        message: "OTP verification required",
      });
    }

    // ⭐ HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // ⭐ UPDATE USER PASSWORD
    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    delete otpStore[email];

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/editPost/:id", async (req, res) => {
  try {

    const { text, mediaUrl } = req.body;

    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      {
        text,
        mediaUrl,
      },
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/save", async (req, res) => {
  try {

    const { userId, postId } = req.body;

    const existing = await Save.findOne({
      userId,
      postId,
    });

    if (existing) {
      await Save.deleteOne({ _id: existing._id });
    } else {
      await Save.create({
        userId,
        postId,
      });
    }

    const savesCount =
      await Save.countDocuments({ postId });

    res.json({
      savesCount,
      saved: !existing,
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/user-analytics/:userId", async (req, res) => {
  try {

    const userId = req.params.userId;

    // PROFILE VIEWS
    const profileViews =
      await ProfileView.countDocuments({
        profileId: userId,
      });

    // TOTAL POST LIKES
    const userPosts = await Post.find({ userId });

    const postIds = userPosts.map(p => p._id);

    const postLikes = await Like.countDocuments({
      postId: { $in: postIds },
    });

    // FOLLOWERS
    const newFollowers = await Connection.countDocuments({
      receiver: userId,
      status: "accepted",
    });

    // PROFILE REACH (example logic)
    const profileReach = profileViews + postLikes;

    // Engagement %
    const engagement =
      profileReach > 0
        ? ((postLikes / profileReach) * 100).toFixed(1)
        : 0;

    res.json({
      profileViews,
      postLikes,
      newFollowers,
      profileReach,
      engagement,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/draft/:id", async (req, res) => {
  try {

    const draft = await Post.findById(req.params.id);

    if (!draft) {
      return res.status(404).json({ message: "Draft not found" });
    }

    res.json(draft);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
