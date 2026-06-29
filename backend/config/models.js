const MODELS = {
  DEEPSEEK_V3: "deepseek/deepseek-chat-v3-0324",
  DEEPSEEK_R1: "deepseek/deepseek-r1",
  GEMINI_FLASH: "google/gemini-2.0-flash-001",
  CLAUDE_HAIKU: "anthropic/claude-3.5-haiku",
  GPT4O_MINI: "openai/gpt-4o-mini",
};
const DEFAULT_MODEL = MODELS.DEEPSEEK_V3;
module.exports = { MODELS, DEFAULT_MODEL };
