const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { generateResponse } = require("../services/aiService");
const { generateTitle } = require("../services/titleService");
const { getSystemPrompt } = require("../services/promptService");
const { processAttachment } = require("../services/fileService");

const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, attachments: raw = [] } = req.body;
    if (!content?.trim() && raw.length === 0) return res.status(400).json({ message: "Content or attachment required" });
    if (!conversationId) return res.status(400).json({ message: "conversationId required" });

    const conversation = await Conversation.findOne({ _id: conversationId, user: req.user });
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (conversation.title === "New Chat") {
      try { conversation.title = await generateTitle(content || raw[0]?.name || "File"); }
      catch { conversation.title = (content || "File").slice(0, 40); }
    }

    // Process attachments
    const processed = [];
    for (const att of raw) {
      try {
        const result = await processAttachment(att);
        processed.push({
          name: att.name,
          mimeType: att.mimeType,
          size: att.size,
          type: result.type,
          data: result.type === "image" ? result.dataUrl : result.extractedText,
        });
      } catch {
        processed.push({ name: att.name, mimeType: att.mimeType, size: att.size, type: "other", data: `[Could not process: ${att.name}]` });
      }
    }

    const userMessage = await Message.create({
      conversation: conversationId, role: "user",
      content: content?.trim() || "", attachments: processed,
    });

    const history = await Message.find({ conversation: conversationId }).sort({ _id: -1 }).limit(20);
    const historyForAI = history.reverse().map((m) => ({ role: m.role, content: m.content, attachments: m.attachments || [] }));

    let aiResponse;
    try {
      aiResponse = await generateResponse(historyForAI, conversation.model, getSystemPrompt(conversation.mode));
    } catch (aiErr) {
      await Message.findByIdAndDelete(userMessage._id);
      return res.status(500).json({ message: `AI error: ${aiErr.message}` });
    }

    const assistantMessage = await Message.create({ conversation: conversationId, role: "assistant", content: aiResponse });
    conversation.updatedAt = new Date();
    await conversation.save();
    res.status(201).json({ userMessage, assistantMessage, conversation });
  } catch (err) {
    console.error("sendMessage:", err);
    res.status(500).json({ message: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.conversationId, user: req.user });
    if (!conversation) return res.status(404).json({ message: "Not found" });
    const messages = await Message.find({ conversation: req.params.conversationId }).sort({ _id: 1 });
    res.json(messages);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { sendMessage, getMessages };