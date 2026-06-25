const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const getSharedChat = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ shareId: req.params.shareId, isShared: true });
    if (!conversation) return res.status(404).json({ message: "Shared chat not found" });
    const messages = await Message.find({ conversation: conversation._id }).sort({ _id: 1 });
    res.json({ conversation, messages });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getSharedChat };