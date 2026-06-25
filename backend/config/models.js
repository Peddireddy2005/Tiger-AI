const MODELS = {
  DEEPSEEK: "deepseek/deepseek-chat-v3-0324",
  GEMINI: "google/gemini-2.5-flash",
  CLAUDE: "anthropic/claude-sonnet-4",
  GPT: "openai/gpt-4o-mini",
};

const DEFAULT_MODEL = MODELS.DEEPSEEK;

module.exports = { MODELS, DEFAULT_MODEL };