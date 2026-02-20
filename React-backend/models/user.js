const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,

  headline: String,
  education: String,
  bio: String,
  profileImage: String,
  skills: [String],
  experiences: [
    {
      role: String,
      company: String,
      duration: String,
      description: String
    }
  ],
  role: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);