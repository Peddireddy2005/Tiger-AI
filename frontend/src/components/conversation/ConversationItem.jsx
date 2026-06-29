import { useState, useRef, useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import ShareModal from "../modals/ShareModal";

const MODE_ICONS = {
  general: "◈", coding: "⌨", research: "◎", learning: "◉", interview: "◆",
};

export default function ConversationItem({ conversation }) {
  const {
    openConversation, currentConversation,
    renameChat, deleteChat, pinChat, splitChat, shareChat, messages,
  } = useChat();

  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(conversation.title);
  const [showShare, setShowShare] = useState(false);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const isActive = currentConversation?._id === conversation._id;

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  // Sync rename value when title changes externally
  useEffect(() => {
    setRenameValue(conversation.title);
  }, [conversation.title]);

  const handleRename = async (e) => {
    e?.preventDefault();
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== conversation.title) {
      await renameChat(conversation._id, trimmed);
    }
    setRenaming(false);
    setMenuOpen(false);
  };

  const handleSplit = async () => {
    if (!isActive || messages.length < 4) return;
    const mid = messages[Math.floor(messages.length / 2)];
    try {
      await splitChat(conversation._id, mid._id);
    } catch {
      alert("Split requires at least 4 messages.");
    }
    setMenuOpen(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${conversation.title}"?`)) {
      deleteChat(conversation._id);
    }
    setMenuOpen(false);
  };

  return (
    <>
      <div
        className={`conv-item ${isActive ? "active" : ""}`}
        onClick={() => !renaming && openConversation(conversation)}
      >
        <span className="conv-mode">{MODE_ICONS[conversation.mode] || "◈"}</span>
        {conversation.pinned && <span className="conv-pin" title="Pinned">↑</span>}
        {conversation.isShared && <span className="conv-shared" title="Shared publicly">🔗</span>}

        {renaming ? (
          <form
            onSubmit={handleRename}
            onClick={(e) => e.stopPropagation()}
            style={{ flex: 1 }}
          >
            <input
              ref={inputRef}
              className="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setRenameValue(conversation.title);
                  setRenaming(false);
                }
              }}
            />
          </form>
        ) : (
          <span className="conv-title">{conversation.title}</span>
        )}

        <div
          className="conv-menu-wrap"
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="conv-dots"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((p) => !p);
            }}
          >
            ···
          </button>

          {menuOpen && (
            <div className="conv-menu">
              <button onClick={() => { setRenaming(true); setMenuOpen(false); }}>
                ✏️ Rename
              </button>
              <button onClick={() => { pinChat(conversation._id, !conversation.pinned); setMenuOpen(false); }}>
                {conversation.pinned ? "📌 Unpin" : "📌 Pin"}
              </button>
              <button onClick={() => { setShowShare(true); setMenuOpen(false); }}>
                🔗 Share
              </button>
              {isActive && messages.length >= 4 && (
                <button onClick={handleSplit}>✂️ Split here</button>
              )}
              <button className="danger" onClick={handleDelete}>
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {showShare && (
        <ShareModal
          conversation={conversation}
          shareChat={shareChat}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}
