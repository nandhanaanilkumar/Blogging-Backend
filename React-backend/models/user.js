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