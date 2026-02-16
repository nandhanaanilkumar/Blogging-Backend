const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  category: String,
  tags: [String],
  likes: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});