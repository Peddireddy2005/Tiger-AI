import { useState } from "react";
import { useChat } from "../../context/ChatContext";

export default function MergeModal({ onClose }) {
  const { conversations, mergeChats, currentConversation } = useChat();
  const [sourceId, setSourceId] = useState(currentConversation?._id || "");
  const [targetId, setTargetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMerge = async () => {
    setError("");
    if (!sourceId || !targetId) { setError("Please select both conversations."); return; }
    if (sourceId === targetId) { setError("Source and target must be different."); return; }

    setLoading(true);
    try {
      await mergeChats(sourceId, targetId);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Merge failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Merge Chats</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <p className="modal-desc">
          Messages from the <strong>source</strong> chat will be appended to the <strong>target</strong>. The source chat will be deleted.
        </p>

        {error && <div className="modal-error">{error}</div>}

        <div className="form-group">
          <label>Source (will be deleted)</label>
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            <option value="">Select source conversation…</option>
            {conversations.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginTop: 12 }}>
          <label>Target (messages merged into)</label>
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">Select target conversation…</option>
            {conversations
              .filter((c) => c._id !== sourceId)
              .map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
          </select>
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-accent" onClick={handleMerge} disabled={loading}>
            {loading ? "Merging…" : "Merge"}
          </button>
        </div>
      </div>
    </div>
  );
}
