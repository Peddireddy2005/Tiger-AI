const axios = require("axios");
const DEFAULT_MODEL = "deepseek/deepseek-chat-v3-0324";
const VISION_MODELS = ["gemini", "claude", "gpt-4o"];
const supportsVision = (model) => VISION_MODELS.some((v) => model.includes(v));

const buildMessages = (messages, model, systemPrompt) => {
  const canSeeImages = supportsVision(model);
  return [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => {
      if (!m.attachments?.length) return { role: m.role, content: m.content };
      const parts = [];
      if (m.content) parts.push({ type: "text", text: m.content });
      for (const att of m.attachments) {
        if (att.type === "image" && att.data && canSeeImages) {
          parts.push({ type: "image_url", image_url: { url: att.data } });
        } else if (att.data && att.type !== "image") {
          parts.push({ type: "text", text: att.data });
        }
      }
      return { role: m.role, content: parts.length ? parts : (m.content || "") };
    }),
  ];
};

const generateResponse = async (messages, model = DEFAULT_MODEL, systemPrompt = "You are Tiger AI.") => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      { model, messages: buildMessages(messages, model, systemPrompt), max_tokens: 3000, temperature: 0.7 },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
          "X-Title": "Tiger AI",
        },
        timeout: 90000,
      }
    );
    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response");
    return content;
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message || "AI error";
    throw new Error(msg);
  }
};

module.exports = { generateResponse, DEFAULT_MODEL };