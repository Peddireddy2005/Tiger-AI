import { useState, useRef, useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import ShareModal from "../modals/ShareModal";

export default function ConversationItem({ conversation }) {
  const { openConversation, currentConversation, renameChat, deleteChat, pinChat, splitChat, shareChat, messages } = useChat();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(conversation.title);
  const [showShare, setShowShare] = useState(false);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const isActive = currentConversation?._id === conversation._id;

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => { if (renaming) inputRef.current?.focus(); }, [renaming]);

  const handleRename = async (e) => {
    e?.preventDefault();
    if (renameValue.trim()) await renameChat(conversation._id, renameValue.trim());
    setRenaming(false); setMenuOpen(false);
  };

  const handleSplit = async () => {
    if (!isActive || messages.length < 4) return;
    const mid = messages[Math.floor(messages.length / 2)];
    try { await splitChat(conversation._id, mid._id); } catch { alert("Need at least 4 messages."); }
    setMenuOpen(false);
  };

  const MODE_ICONS = { general: "◈", coding: "⌨", research: "◎", learning: "◉", interview: "◆" };

  return (
    <>
      <div className={`conv-item ${isActive ? "active" : ""}`} onClick={() => !renaming && openConversation(conversation)}>
        <span className="conv-mode">{MODE_ICONS[conversation.mode] || "◈"}</span>
        {conversation.pinned && <span className="conv-pin">↑</span>}
        {conversation.isShared && <span className="conv-shared" title="Shared">🔗</span>}

        {renaming ? (
          <form onSubmit={handleRename} onClick={(e) => e.stopPropagation()} style={{ flex: 1 }}>
            <input ref={inputRef} className="rename-input" value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Escape" && setRenaming(false)} />
          </form>
        ) : (
          <span className="conv-title">{conversation.title}</span>
        )}

        <div className="conv-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button className="conv-dots" onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}>···</button>
          {menuOpen && (
            <div className="conv-menu">
              <button onClick={() => { setRenaming(true); setMenuOpen(false); }}>✏️ Rename</button>
              <button onClick={() => { pinChat(conversation._id, !conversation.pinned); setMenuOpen(false); }}>
                {conversation.pinned ? "📌 Unpin" : "📌 Pin"}
              </button>
              <button onClick={() => { setShowShare(true); setMenuOpen(false); }}>🔗 Share</button>
              {isActive && messages.length >= 4 && <button onClick={handleSplit}>✂️ Split here</button>}
              <button className="danger" onClick={() => { deleteChat(conversation._id); setMenuOpen(false); }}>🗑️ Delete</button>
            </div>
          )}
        </div>
      </div>
      {showShare && <ShareModal conversation={conversation} shareChat={shareChat} onClose={() => setShowShare(false)} />}
    </>
  );
}