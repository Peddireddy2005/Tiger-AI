const axios = require("axios");

const DEFAULT_MODEL = "deepseek/deepseek-chat-v3-0324";

// Models that support vision/image input
const VISION_MODELS = ["gemini", "claude", "gpt-4o", "gpt-4-vision"];

const supportsVision = (model) =>
  VISION_MODELS.some((v) => model.toLowerCase().includes(v));

const buildMessages = (messages, model, systemPrompt) => {
  const canSeeImages = supportsVision(model);

  const built = messages.map((m) => {
    if (!m.attachments?.length) {
      return { role: m.role, content: m.content || "" };
    }

    const parts = [];
    if (m.content?.trim()) {
      parts.push({ type: "text", text: m.content });
    }

    for (const att of m.attachments) {
      if (att.type === "image" && att.data && canSeeImages) {
        // data could be a dataUrl or base64 — handle both
        const url = att.data.startsWith("data:")
          ? att.data
          : `data:${att.mimeType};base64,${att.data}`;
        parts.push({ type: "image_url", image_url: { url } });
      } else if (att.data && att.type !== "image") {
        parts.push({ type: "text", text: att.data });
      }
    }

    return {
      role: m.role,
      content: parts.length ? parts : (m.content || ""),
    };
  });

  return [
    { role: "system", content: systemPrompt },
    ...built,
  ];
};

const generateResponse = async (
  messages,
  model = DEFAULT_MODEL,
  systemPrompt = "You are Tiger AI, a helpful assistant."
) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages: buildMessages(messages, model, systemPrompt),
        max_tokens: 4000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
          "X-Title": "Tiger AI",
        },
        timeout: 120000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response received");
    return content;
  } catch (err) {
    if (err.response?.status === 402) {
      throw new Error("API credit limit reached. Please check your OpenRouter balance.");
    }
    if (err.response?.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }
    const msg =
      err.response?.data?.error?.message ||
      err.message ||
      "AI service error";
    throw new Error(msg);
  }
};

module.exports = { generateResponse, DEFAULT_MODEL, supportsVision };
