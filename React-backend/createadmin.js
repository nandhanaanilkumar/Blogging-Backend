const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// SAME schema as server.js
const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  headline: String,
  education: String,
  bio: String,
  profileImage: String,
  role: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

mongoose.connect("mongodb://127.0.0.1:27017/blogApp")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const createAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = new User({
      firstName: "Admin",
      lastName: "User",
      email: "admin@blog.com",
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();
    console.log("Admin created successfully");
    process.exit();

  } catch (err) {
    console.log(err);
    process.exit();
  }
};

createAdmin();
