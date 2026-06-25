import { useState } from "react";

const FRONTEND_URL = window.location.origin;

export default function ShareModal({ conversation, shareChat, onClose }) {
  const [loading, setLoading] = useState(false);
  const [shared, setShared] = useState(conversation.isShared);
  const [shareId, setShareId] = useState(conversation.shareId);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const shareLink = shareId ? `${FRONTEND_URL}/share/${shareId}` : "";

  const toggleShare = async () => {
    setLoading(true); setError("");
    try {
      const res = await shareChat(conversation._id, !shared);
      setShared(!shared);
      setShareId(res.shareId || null);
    } catch { setError("Failed to update share settings."); }
    finally { setLoading(false); }
  };

  const copyLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Share Chat</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <p className="modal-desc">
          Share this conversation publicly. Anyone with the link can view it (read-only).
        </p>

        {error && <div className="modal-error">{error}</div>}

        <div className="share-toggle-row">
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>Public link</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>
              {shared ? "Anyone with the link can view" : "Sharing is disabled"}
            </div>
          </div>
          <button className={`share-toggle-btn ${shared ? "on" : "off"}`} onClick={toggleShare} disabled={loading}>
            {loading ? <span className="spinner-sm dark" /> : (shared ? "On" : "Off")}
          </button>
        </div>

        {shared && shareLink && (
          <div className="share-link-row">
            <input className="share-link-input" value={shareLink} readOnly onClick={(e) => e.target.select()} />
            <button className="btn-accent" onClick={copyLink}>
              {copied ? "✓ Copied!" : "Copy link"}
            </button>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}