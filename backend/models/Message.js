const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  name: String,
  type: String,
  mimeType: String,
  size: Number,
  data: String,
}, { _id: false });

const tokenUsageSchema = new mongoose.Schema({
  prompt: { type: Number, default: 0 },
  completion: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, default: "" },
  attachments: [attachmentSchema],
  starred: { type: Boolean, default: false },
  tokenUsage: { type: tokenUsageSchema, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
