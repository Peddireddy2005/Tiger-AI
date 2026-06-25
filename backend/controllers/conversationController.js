const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { generateTitle } = require("../services/titleService");
const crypto = require("crypto");

const createConversation = async (req, res) => {
  try {
    const { model = "deepseek/deepseek-chat-v3-0324", mode = "general" } = req.body;
    const c = await Conversation.create({ user: req.user, title: "New Chat", model, mode });
    res.status(201).json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getConversations = async (req, res) => {
  try {
    const c = await Conversation.find({ user: req.user }).sort({ pinned: -1, updatedAt: -1 });
    res.json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const searchConversations = async (req, res) => {
  try {
    const q = req.query.q?.trim() || "";
    if (!q) return res.json([]);
    const c = await Conversation.find({ user: req.user, title: { $regex: q, $options: "i" } }).sort({ updatedAt: -1 }).limit(20);
    res.json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateConversation = async (req, res) => {
  try {
    const { title, mode, model, pinned } = req.body;
    const update = {};
    if (title !== undefined) update.title = title.slice(0, 100);
    if (mode !== undefined) update.mode = mode;
    if (model !== undefined) update.model = model;
    if (pinned !== undefined) update.pinned = pinned;
    const c = await Conversation.findOneAndUpdate({ _id: req.params.id, user: req.user }, update, { new: true });
    if (!c) return res.status(404).json({ message: "Not found" });
    res.json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteConversation = async (req, res) => {
  try {
    const c = await Conversation.findOneAndDelete({ _id: req.params.id, user: req.user });
    if (!c) return res.status(404).json({ message: "Not found" });
    await Message.deleteMany({ conversation: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const mergeConversations = async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;
    if (!sourceId || !targetId) return res.status(400).json({ message: "Both IDs required" });
    if (sourceId === targetId) return res.status(400).json({ message: "Cannot merge with itself" });
    const [source, target] = await Promise.all([
      Conversation.findOne({ _id: sourceId, user: req.user }),
      Conversation.findOne({ _id: targetId, user: req.user }),
    ]);
    if (!source || !target) return res.status(404).json({ message: "Not found" });
    await Message.updateMany({ conversation: sourceId }, { conversation: targetId });
    await Conversation.findByIdAndDelete(sourceId);
    target.updatedAt = new Date();
    await target.save();
    const messages = await Message.find({ conversation: targetId }).sort({ _id: 1 });
    res.json({ conversation: target, messages });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const splitConversation = async (req, res) => {
  try {
    const original = await Conversation.findOne({ _id: req.params.id, user: req.user });
    if (!original) return res.status(404).json({ message: "Not found" });
    const { messageId } = req.body;
    if (!messageId) return res.status(400).json({ message: "messageId required" });
    const all = await Message.find({ conversation: req.params.id }).sort({ _id: 1 });
    if (all.length < 2) return res.status(400).json({ message: "Not enough messages" });
    const idx = all.findIndex((m) => m._id.toString() === messageId.toString());
    if (idx <= 0) return res.status(400).json({ message: "Invalid split point" });
    const toMove = all.slice(idx);
    const newConv = await Conversation.create({ user: req.user, title: "New Chat", model: original.model, mode: original.mode });
    await Message.updateMany({ _id: { $in: toMove.map((m) => m._id) } }, { conversation: newConv._id });
    try { newConv.title = await generateTitle(toMove[0].content || "Split chat"); } catch { newConv.title = "Split Chat"; }
    await newConv.save();
    const updated = await Message.find({ conversation: newConv._id }).sort({ _id: 1 });
    res.json({ conversation: newConv, messages: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const shareConversation = async (req, res) => {
  try {
    const { share } = req.body;
    const c = await Conversation.findOne({ _id: req.params.id, user: req.user });
    if (!c) return res.status(404).json({ message: "Not found" });
    if (share) {
      if (!c.shareId) c.shareId = crypto.randomBytes(16).toString("hex");
      c.isShared = true;
    } else {
      c.isShared = false;
      c.shareId = null;
    }
    await c.save();
    res.json({ conversation: c, shareId: c.shareId });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { createConversation, getConversations, searchConversations, updateConversation, deleteConversation, mergeConversations, splitConversation, shareConversation };