const { generateResponse, DEFAULT_MODEL } = require("./aiService");
const generateTitle = async (message) => {
  try {
    const title = await generateResponse(
      [{ role: "user", content: `Short title (max 5 words, no quotes): "${message.slice(0, 200)}"` }],
      DEFAULT_MODEL,
      "Generate short chat titles only. Return ONLY the title."
    );
    return title.trim().replace(/["'\n]/g, "").slice(0, 60) || "New Chat";
  } catch {
    return message.slice(0, 40) + (message.length > 40 ? "..." : "");
  }
};
module.exports = { generateTitle };