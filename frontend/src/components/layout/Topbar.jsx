import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChat } from "../../context/ChatContext";
import ShareModal from "../modals/ShareModal";

const MODES = [
  { value: "general",   label: "General",   icon: "◈" },
  { value: "coding",    label: "Code",       icon: "⌨" },
  { value: "research",  label: "Research",   icon: "◎" },
  { value: "learning",  label: "Learn",      icon: "◉" },
  { value: "interview", label: "Interview",  icon: "◆" },
];

const MODELS = [
  { value: "deepseek/deepseek-chat-v3-0324", label: "DeepSeek V3",       icon: "🔷", desc: "Fast & capable",  badge: "free"   },
  { value: "deepseek/deepseek-r1",           label: "DeepSeek R1",       icon: "🧠", desc: "Deep reasoning", badge: "free"   },
  { value: "google/gemini-2.0-flash-001",    label: "Gemini 2.0 Flash",  icon: "✨", desc: "Fast + vision",  badge: "vision" },
  { value: "anthropic/claude-3.5-haiku",     label: "Claude 3.5 Haiku",  icon: "🟣", desc: "Smart & fast",   badge: null     },
  { value: "openai/gpt-4o-mini",             label: "GPT-4o Mini",       icon: "⚡", desc: "Reliable & quick", badge: null   },
];

function formatLastUpdated(updatedAt) {
  if (!updatedAt) return "";
  const diff = Date.now() - new Date(updatedAt).getTime();
  if (diff < 60000)   return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function Topbar({ onToggleSidebar, sidebarCollapsed }) {
  const { currentConversation, changeMode, changeModel, shareChat, exportChat } = useChat();
  const [modelOpen, setModelOpen]   = useState(false);
  const [showShare, setShowShare]   = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [, forceRefresh] = useState(0);
  const dropRef = useRef(null);

  useEffect(() => {
    if (!currentConversation?.updatedAt) return;
    const id = setInterval(() => forceRefresh((v) => v + 1), 30000);
    return () => clearInterval(id);
  }, [currentConversation?.updatedAt]);

  const lastUpdated = useMemo(() => formatLastUpdated(currentConversation?.updatedAt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentConversation?.updatedAt, Math.floor(Date.now() / 30000)]
  );

  const closeDropdown = useCallback((e) => {
    if (dropRef.current && !dropRef.current.contains(e.target)) setModelOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", closeDropdown);
    return () => document.removeEventListener("mousedown", closeDropdown);
  }, [closeDropdown]);

  if (!currentConversation) {
    return (
      <div className="topbar topbar-empty">
        {sidebarCollapsed && (
          <button className="sidebar-icon-btn small" onClick={onToggleSidebar} title="Expand sidebar (Ctrl+B)" style={{ marginLeft: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
        )}
      </div>
    );
  }

  const mode = currentConversation.mode || "general";
  const model = currentConversation.model || MODELS[0].value;
  const modelInfo = MODELS.find((m) => m.value === model) || MODELS[0];

  return (
    <>
      <div className="topbar">
        <div className="topbar-left" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {sidebarCollapsed && (
            <button className="sidebar-icon-btn small" onClick={onToggleSidebar} title="Expand sidebar (Ctrl+B)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
            </button>
          )}
          <div className="topbar-title-wrap">
            <span className="topbar-title" title={currentConversation.title}>{currentConversation.title}</span>
            <span className="topbar-subtitle">
              {modelInfo.icon} {modelInfo.label} · {mode.charAt(0).toUpperCase() + mode.slice(1)}{lastUpdated ? ` · ${lastUpdated}` : ""}
            </span>
          </div>
        </div>

        <div className="topbar-right">
          {/* Mode pills */}
          <div className="mode-pills">
            {MODES.map((m) => (
              <button key={m.value} className={`mode-pill ${mode === m.value ? "active" : ""}`} onClick={() => changeMode(currentConversation._id, m.value)} title={m.label}>
                <span>{m.icon}</span><span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Model selector */}
          <div className="model-selector-wrap" ref={dropRef}>
            <button className="model-select-btn" onClick={() => setModelOpen((p) => !p)}>
              <span>{modelInfo.icon}</span><span>{modelInfo.label}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {modelOpen && (
              <div className="model-dropdown">
                {MODELS.map((m) => (
                  <div key={m.value} className={`model-option ${model === m.value ? "active" : ""}`} onClick={() => { changeModel(currentConversation._id, m.value); setModelOpen(false); }}>
                    <span className="model-option-icon">{m.icon}</span>
                    <div className="model-option-info">
                      <div className="model-option-name">{m.label}</div>
                      <div className="model-option-desc">{m.desc}</div>
                    </div>
                    {m.badge && <span className={`model-option-badge ${m.badge}`}>{m.badge}</span>}
                    {model === m.value && <span className="model-option-check">✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export dropdown */}
          <div style={{ position: "relative" }}>
            <button className="share-btn" onClick={() => setShowExport((p) => !p)} title="Export chat (Ctrl+E)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
            {showExport && (
              <div className="model-dropdown" style={{ minWidth: 140 }} onClick={() => setShowExport(false)}>
                <div className="model-option" onClick={() => exportChat("markdown")}>
                  <span className="model-option-icon">📄</span>
                  <div className="model-option-info"><div className="model-option-name">Markdown</div><div className="model-option-desc">.md file</div></div>
                </div>
                <div className="model-option" onClick={() => exportChat("json")}>
                  <span className="model-option-icon">📦</span>
                  <div className="model-option-info"><div className="model-option-name">JSON</div><div className="model-option-desc">.json file</div></div>
                </div>
              </div>
            )}
          </div>

          {/* Share */}
          <button className="share-btn" onClick={() => setShowShare(true)} title="Share chat">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
        </div>
      </div>

      {showShare && <ShareModal conversation={currentConversation} shareChat={shareChat} onClose={() => setShowShare(false)} />}
    </>
  );
}
