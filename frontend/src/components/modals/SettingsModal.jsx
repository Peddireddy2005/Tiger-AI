import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";

const FONT_SIZES = ["13px", "14px", "15px", "16px"];
const SEND_KEYS  = ["Enter", "Ctrl+Enter"];

function Section({ title, children }) {
  return (
    <div className="settings-section">
      <div className="settings-section-title">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-left">
        <span className="settings-row-label">{label}</span>
        {hint && <span className="settings-row-hint">{hint}</span>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

export default function SettingsModal({ onClose }) {
  const { theme, toggleTheme } = useTheme();
  const { exportChat, currentConversation } = useChat();
  const { user } = useAuth();

  const [fontSize, setFontSize]   = useState(() => localStorage.getItem("tiger-font-size") || "14px");
  const [sendKey, setSendKey]     = useState(() => localStorage.getItem("tiger-send-key") || "Enter");
  const [showTokens, setShowTokens] = useState(() => localStorage.getItem("tiger-show-tokens") !== "false");
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem("tiger-compact") === "true");
  const [copied, setCopied]       = useState(false);
  const [resetting, setResetting] = useState(false);

  const applyFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem("tiger-font-size", size);
    document.documentElement.style.setProperty("--chat-font-size", size);
  };

  const applySendKey = (key) => {
    setSendKey(key);
    localStorage.setItem("tiger-send-key", key);
  };

  const applyTokens = (val) => {
    setShowTokens(val);
    localStorage.setItem("tiger-show-tokens", String(val));
  };

  const applyCompact = (val) => {
    setCompactMode(val);
    localStorage.setItem("tiger-compact", String(val));
    document.documentElement.setAttribute("data-compact", String(val));
  };

  const copySystemInfo = async () => {
    const info = [
      `Tiger AI — System Info`,
      `User: ${user?.name} (${user?.email})`,
      `Theme: ${theme}`,
      `Font size: ${fontSize}`,
      `User Agent: ${navigator.userAgent}`,
      `Date: ${new Date().toISOString()}`,
    ].join("\n");
    await navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetSettings = () => {
    if (!confirm("Reset appearance & behavior settings to defaults?")) return;
    setResetting(true);
    ["tiger-font-size", "tiger-send-key", "tiger-show-tokens", "tiger-compact"].forEach((k) =>
      localStorage.removeItem(k)
    );
    document.documentElement.style.removeProperty("--chat-font-size");
    document.documentElement.removeAttribute("data-compact");
    // Leave theme as-is — resetting theme on every "reset" tends to surprise users
    window.location.reload();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>⚙️ Settings</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-body">
          {/* Appearance */}
          <Section title="Appearance">
            <Row label="Theme" hint="Toggle light / dark mode">
              <button className="settings-toggle-btn" onClick={toggleTheme}>
                {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
              </button>
            </Row>
            <Row label="Font Size" hint="Chat message text size">
              <div className="settings-btn-group">
                {FONT_SIZES.map((s) => (
                  <button
                    key={s}
                    className={`settings-size-btn ${fontSize === s ? "active" : ""}`}
                    onClick={() => applyFontSize(s)}
                  >
                    {s.replace("px", "")}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Compact Mode" hint="Reduce message padding">
              <label className="settings-switch">
                <input type="checkbox" checked={compactMode} onChange={(e) => applyCompact(e.target.checked)} />
                <span className="settings-switch-slider" />
              </label>
            </Row>
          </Section>

          {/* Behavior */}
          <Section title="Behavior">
            <Row label="Send Message" hint="Key to submit a message">
              <div className="settings-btn-group">
                {SEND_KEYS.map((k) => (
                  <button
                    key={k}
                    className={`settings-size-btn ${sendKey === k ? "active" : ""}`}
                    onClick={() => applySendKey(k)}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Token Usage" hint="Show token counts after responses">
              <label className="settings-switch">
                <input type="checkbox" checked={showTokens} onChange={(e) => applyTokens(e.target.checked)} />
                <span className="settings-switch-slider" />
              </label>
            </Row>
          </Section>

          {/* Export */}
          <Section title="Export">
            <Row label="Export Chat" hint={currentConversation ? currentConversation.title : "Open a chat first"}>
              <div className="settings-btn-group">
                <button
                  className="settings-action-btn"
                  disabled={!currentConversation}
                  onClick={() => { exportChat("markdown"); onClose(); }}
                >
                  📄 Markdown
                </button>
                <button
                  className="settings-action-btn"
                  disabled={!currentConversation}
                  onClick={() => { exportChat("json"); onClose(); }}
                >
                  📦 JSON
                </button>
              </div>
            </Row>
          </Section>

          {/* Keyboard Shortcuts */}
          <Section title="Keyboard Shortcuts">
            <div className="settings-shortcuts">
              {[
                ["New Chat",          "Ctrl + K"],
                ["Focus Input",       "Ctrl + /"],
                ["Stop Generation",   "Esc"],
                ["Toggle Sidebar",    "Ctrl + B"],
                ["Regenerate Reply",  "Ctrl + R"],
                ["Export Chat",       "Ctrl + E"],
                ["Toggle Theme",      "Ctrl + Shift + L"],
              ].map(([action, shortcut]) => (
                <div className="settings-shortcut-row" key={action}>
                  <span>{action}</span>
                  <kbd>{shortcut}</kbd>
                </div>
              ))}
            </div>
          </Section>

          {/* About */}
          <Section title="About">
            <Row label="Version" hint="Tiger AI">
              <span style={{ color: "var(--text-3)", fontSize: 13 }}>v2.0.0</span>
            </Row>
            <Row label="System Info">
              <button className="settings-action-btn" onClick={copySystemInfo}>
                {copied ? "✓ Copied" : "Copy Info"}
              </button>
            </Row>
            <Row label="Reset Settings" hint="Restore default appearance & behavior">
              <button className="settings-action-btn danger" onClick={resetSettings} disabled={resetting}>
                {resetting ? "Resetting…" : "Reset"}
              </button>
            </Row>
          </Section>
        </div>
      </div>
    </div>
  );
}