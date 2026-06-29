const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { generateTitle } = require("../services/titleService");
const { getSystemPrompt } = require("../services/promptService");
const { processAttachment } = require("../services/fileService");
const axios = require("axios");

// ─── Streaming endpoint ────────────────────────────────────────────────────────
const streamMessage = async (req, res) => {
  const { conversationId, content, attachments: raw = [] } = req.body;

  if (!content?.trim() && raw.length === 0)
    return res.status(400).json({ message: "Content or attachment required" });
  if (!conversationId)
    return res.status(400).json({ message: "conversationId required" });

  try {
    const conversation = await Conversation.findOne({ _id: conversationId, user: req.user });
    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });

    if (conversation.title === "New Chat") {
      try { conversation.title = await generateTitle(content || raw[0]?.name || "File"); }
      catch { conversation.title = (content || "File").slice(0, 40); }
    }

    const processed = [];
    for (const att of raw) {
      try {
        const result = await processAttachment(att);
        processed.push({ name: att.name, mimeType: att.mimeType, size: att.size, type: result.type, data: result.type === "image" ? result.dataUrl : result.extractedText });
      } catch {
        processed.push({ name: att.name, mimeType: att.mimeType, size: att.size, type: "other", data: `[Could not process: ${att.name}]` });
      }
    }

    const userMessage = await Message.create({ conversation: conversationId, role: "user", content: content?.trim() || "", attachments: processed });

    const history = await Message.find({ conversation: conversationId }).sort({ createdAt: 1 }).limit(20);
    const historyForAI = history.map((m) => ({ role: m.role, content: m.content, attachments: m.attachments || [] }));

    const VISION_MODELS = ["gemini", "claude", "gpt-4o"];
    const canSeeImages = VISION_MODELS.some((v) => (conversation.model || "").includes(v));
    const systemPrompt = getSystemPrompt(conversation.mode);

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...historyForAI.map((m) => {
        if (!m.attachments?.length) return { role: m.role, content: m.content || "" };
        const parts = [];
        if (m.content?.trim()) parts.push({ type: "text", text: m.content });
        for (const att of m.attachments) {
          if (att.type === "image" && att.data && canSeeImages) {
            const url = att.data.startsWith("data:") ? att.data : `data:${att.mimeType};base64,${att.data}`;
            parts.push({ type: "image_url", image_url: { url } });
          } else if (att.data && att.type !== "image") {
            parts.push({ type: "text", text: att.data });
          }
        }
        return { role: m.role, content: parts.length ? parts : (m.content || "") };
      }),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: "userMessage", message: userMessage })}\n\n`);

    let fullContent = "";
    let promptTokens = 0;
    let completionTokens = 0;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      { model: conversation.model || "deepseek/deepseek-chat-v3-0324", messages: aiMessages, max_tokens: 4000, temperature: 0.7, stream: true },
      { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json", "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173", "X-Title": "Tiger AI" }, responseType: "stream", timeout: 120000 }
    );

    response.data.on("data", (chunk) => {
      const lines = chunk.toString().split("\n").filter((l) => l.trim());
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) { fullContent += delta; res.write(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`); }
          if (parsed.usage) { promptTokens = parsed.usage.prompt_tokens || 0; completionTokens = parsed.usage.completion_tokens || 0; }
        } catch { /* ignore malformed lines */ }
      }
    });

    response.data.on("end", async () => {
      try {
        const assistantMessage = await Message.create({ conversation: conversationId, role: "assistant", content: fullContent, tokenUsage: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens } });
        conversation.updatedAt = new Date();
        await conversation.save();
        res.write(`data: ${JSON.stringify({ type: "done", assistantMessage, conversation, tokenUsage: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens } })}\n\n`);
        res.end();
      } catch (err) {
        res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
        res.end();
      }
    });

    response.data.on("error", async (err) => {
      await Message.findByIdAndDelete(userMessage._id).catch(() => {});
      res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
      res.end();
    });

  } catch (err) {
    console.error("streamMessage error:", err);
    if (!res.headersSent) return res.status(500).json({ message: err.message });
    res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
    res.end();
  }
};

// ─── Regenerate ───────────────────────────────────────────────────────────────
const regenerateMessage = async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) return res.status(400).json({ message: "conversationId required" });
    const conversation = await Conversation.findOne({ _id: conversationId, user: req.user });
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    const lastAssistant = await Message.findOne({ conversation: conversationId, role: "assistant" }).sort({ createdAt: -1 });
    if (lastAssistant) await Message.findByIdAndDelete(lastAssistant._id);
    const history = await Message.find({ conversation: conversationId }).sort({ createdAt: 1 }).limit(20);
    if (!history.length) return res.status(400).json({ message: "No messages to regenerate from" });
    const { generateResponse } = require("../services/aiService");
    const historyForAI = history.map((m) => ({ role: m.role, content: m.content, attachments: m.attachments || [] }));
    const aiResponse = await generateResponse(historyForAI, conversation.model, getSystemPrompt(conversation.mode));
    const assistantMessage = await Message.create({ conversation: conversationId, role: "assistant", content: aiResponse });
    conversation.updatedAt = new Date();
    await conversation.save();
    res.json({ assistantMessage, conversation });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Star a message ───────────────────────────────────────────────────────────
const reactToMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(req.params.messageId, { starred: req.body.starred }, { new: true });
    if (!message) return res.status(404).json({ message: "Message not found" });
    res.json(message);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Export conversation ──────────────────────────────────────────────────────
const exportConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.conversationId, user: req.user });
    if (!conversation) return res.status(404).json({ message: "Not found" });
    const messages = await Message.find({ conversation: req.params.conversationId }).sort({ createdAt: 1 });
    const format = req.query.format || "json";
    if (format === "markdown") {
      let md = `# ${conversation.title}\n\n`;
      md += `*Model: ${conversation.model} | Mode: ${conversation.mode} | Exported: ${new Date().toLocaleString()}*\n\n---\n\n`;
      for (const m of messages) {
        md += `## ${m.role === "user" ? "You" : "Tiger AI"}\n\n${m.content}\n\n---\n\n`;
      }
      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("Content-Disposition", `attachment; filename="${conversation.title.replace(/[^a-z0-9]/gi, "_")}.md"`);
      return res.send(md);
    }
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${conversation.title.replace(/[^a-z0-9]/gi, "_")}.json"`);
    res.json({ conversation: { title: conversation.title, model: conversation.model, mode: conversation.mode, createdAt: conversation.createdAt }, messages: messages.map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt, starred: m.starred })) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Non-streaming fallback ────────────────────────────────────────────────────
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
    const processed = [];
    for (const att of raw) {
      try {
        const result = await processAttachment(att);
        processed.push({ name: att.name, mimeType: att.mimeType, size: att.size, type: result.type, data: result.type === "image" ? result.dataUrl : result.extractedText });
      } catch { processed.push({ name: att.name, mimeType: att.mimeType, size: att.size, type: "other", data: `[Could not process: ${att.name}]` }); }
    }
    const userMessage = await Message.create({ conversation: conversationId, role: "user", content: content?.trim() || "", attachments: processed });
    const history = await Message.find({ conversation: conversationId }).sort({ createdAt: 1 }).limit(20);
    const historyForAI = history.map((m) => ({ role: m.role, content: m.content, attachments: m.attachments || [] }));
    const { generateResponse } = require("../services/aiService");
    let aiResponse;
    try { aiResponse = await generateResponse(historyForAI, conversation.model, getSystemPrompt(conversation.mode)); }
    catch (aiErr) { await Message.findByIdAndDelete(userMessage._id); return res.status(500).json({ message: `AI error: ${aiErr.message}` }); }
    const assistantMessage = await Message.create({ conversation: conversationId, role: "assistant", content: aiResponse });
    conversation.updatedAt = new Date();
    await conversation.save();
    res.status(201).json({ userMessage, assistantMessage, conversation });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.conversationId, user: req.user });
    if (!conversation) return res.status(404).json({ message: "Not found" });
    const messages = await Message.find({ conversation: req.params.conversationId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { sendMessage, streamMessage, regenerateMessage, reactToMessage, exportConversation, getMessages };
