const { generateResponse, DEFAULT_MODEL } = require("./aiService");

const generateTitle = async (message) => {
  if (!message || typeof message !== "string") return "New Chat";
  
  try {
    const title = await generateResponse(
      [
        {
          role: "user",
          content: `Generate a short, descriptive title (max 5 words, no quotes, no punctuation at end) for a chat that starts with: "${message.slice(0, 300)}"`,
        },
      ],
      DEFAULT_MODEL,
      "You generate short chat titles only. Return ONLY the title text, nothing else. No quotes, no punctuation at end, max 5 words."
    );
    return title.trim().replace(/["'\n.!?]/g, "").slice(0, 60) || "New Chat";
  } catch {
    // Fallback: use first few words of message
    const words = message.trim().split(/\s+/).slice(0, 5).join(" ");
    return (words.length > 3 ? words : "New Chat").slice(0, 60);
  }
};

module.exports = { generateTitle };
