import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChat } from "../../context/ChatContext";
import ShareModal from "../modals/ShareModal";

const MODES = [
  { value: "general", label: "General", icon: "◈" },
  { value: "coding", label: "Code", icon: "⌨" },
  { value: "research", label: "Research", icon: "◎" },
  { value: "learning", label: "Learn", icon: "◉" },
  { value: "interview", label: "Interview", icon: "◆" },
];

const MODELS = [
  {
    value: "deepseek/deepseek-chat-v3-0324",
    label: "DeepSeek V3",
    icon: "🔷",
    desc: "Fast & free",
  },
  {
    value: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    icon: "✨",
    desc: "Multimodal · Vision",
  },
  {
    value: "anthropic/claude-sonnet-4",
    label: "Claude Sonnet 4",
    icon: "🟣",
    desc: "Nuanced reasoning",
  },
  {
    value: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    icon: "⚡",
    desc: "Fast & capable",
  },
];

function formatLastUpdated(updatedAt) {
  if (!updatedAt) return "";

  const diff =
    new Date().getTime() - new Date(updatedAt).getTime();

  if (diff < 60000) return "just now";
  if (diff < 3600000)
    return `${Math.floor(diff / 60000)}m ago`;

  return `${Math.floor(diff / 3600000)}h ago`;
}

export default function Topbar() {
  const {
    currentConversation,
    changeMode,
    changeModel,
    shareChat,
  } = useChat();

  const [modelOpen, setModelOpen] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Used only to refresh relative time every 30s
  const [, forceRefresh] = useState(0);

  const dropRef = useRef(null);

  useEffect(() => {
    if (!currentConversation?.updatedAt) return;

    const interval = setInterval(() => {
      forceRefresh((v) => v + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentConversation?.updatedAt]);

  const lastUpdated = useMemo(() => {
    return formatLastUpdated(currentConversation?.updatedAt);
  }, [currentConversation?.updatedAt]);

  const closeDropdown = useCallback((e) => {
    if (
      dropRef.current &&
      !dropRef.current.contains(e.target)
    ) {
      setModelOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", closeDropdown);

    return () => {
      document.removeEventListener(
        "mousedown",
        closeDropdown
      );
    };
  }, [closeDropdown]);

  if (!currentConversation) {
    return <div className="topbar topbar-empty" />;
  }

  const mode = currentConversation.mode || "general";

  const model =
    currentConversation.model ||
    "deepseek/deepseek-chat-v3-0324";

  const modelInfo =
    MODELS.find((m) => m.value === model) || MODELS[0];

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-title-wrap">
            <span className="topbar-title">
              {currentConversation.title}
            </span>

            <span className="topbar-subtitle">
              {modelInfo.icon} {modelInfo.label}
              {" · "}
              {mode.charAt(0).toUpperCase() +
                mode.slice(1)}
              {lastUpdated
                ? ` · ${lastUpdated}`
                : ""}
            </span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="mode-pills">
            {MODES.map((m) => (
              <button
                key={m.value}
                className={`mode-pill ${
                  mode === m.value ? "active" : ""
                }`}
                onClick={() =>
                  changeMode(
                    currentConversation._id,
                    m.value
                  )
                }
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <div
            className="model-selector-wrap"
            ref={dropRef}
          >
            <button
              className="model-select-btn"
              onClick={() =>
                setModelOpen((prev) => !prev)
              }
            >
              <span>{modelInfo.icon}</span>
              <span>{modelInfo.label}</span>

              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {modelOpen && (
              <div className="model-dropdown">
                {MODELS.map((m) => (
                  <div
                    key={m.value}
                    className={`model-option ${
                      model === m.value
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {
                      changeModel(
                        currentConversation._id,
                        m.value
                      );
                      setModelOpen(false);
                    }}
                  >
                    <span className="model-option-icon">
                      {m.icon}
                    </span>

                    <div className="model-option-info">
                      <div className="model-option-name">
                        {m.label}
                      </div>

                      <div className="model-option-desc">
                        {m.desc}
                      </div>
                    </div>

                    {model === m.value && (
                      <span className="model-option-check">
                        ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="share-btn"
            onClick={() => setShowShare(true)}
            title="Share chat"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line
                x1="8.59"
                y1="13.51"
                x2="15.42"
                y2="17.49"
              />
              <line
                x1="15.41"
                y1="6.51"
                x2="8.59"
                y2="10.49"
              />
            </svg>
            Share
          </button>
        </div>
      </div>

      {showShare && (
        <ShareModal
          conversation={currentConversation}
          shareChat={shareChat}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}