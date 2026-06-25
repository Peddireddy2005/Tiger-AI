const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  name: String,
  type: String,
  mimeType: String,
  size: Number,
  data: String,
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, default: "" },   // NOT required — attachments-only messages are valid
  attachments: [attachmentSchema],
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);