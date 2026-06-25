const mongoose = require("mongoose");
const conversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "New Chat" },
  model: { type: String, default: "deepseek/deepseek-chat-v3-0324" },
  mode: { type: String, enum: ["general","coding","research","learning","interview"], default: "general" },
  pinned: { type: Boolean, default: false },
  isShared: { type: Boolean, default: false },
  shareId: { type: String, default: null, index: true },
}, { timestamps: true });
module.exports = mongoose.model("Conversation", conversationSchema);