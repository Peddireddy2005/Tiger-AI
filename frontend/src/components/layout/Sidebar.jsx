import { useState, useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ConversationItem from "../conversation/ConversationItem";
import MergeModal from "../modals/MergeModal";
import SettingsModal from "../modals/SettingsModal";
import TigerIcon from "../common/TigerIcon";

function groupByDate(conversations) {
  const now = new Date();
  const startOfToday     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOf7Days     = new Date(startOfToday); startOf7Days.setDate(startOf7Days.getDate() - 7);
  const startOf30Days    = new Date(startOfToday); startOf30Days.setDate(startOf30Days.getDate() - 30);

  const groups = { Pinned: [], Today: [], Yesterday: [], "Last 7 Days": [], "Last 30 Days": [], Older: [] };
  conversations.forEach((c) => {
    if (c.pinned) { groups.Pinned.push(c); return; }
    const d = new Date(c.updatedAt);
    if (d >= startOfToday) groups.Today.push(c);
    else if (d >= startOfYesterday) groups.Yesterday.push(c);
    else if (d >= startOf7Days) groups["Last 7 Days"].push(c);
    else if (d >= startOf30Days) groups["Last 30 Days"].push(c);
    else groups.Older.push(c);
  });
  return groups;
}

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";
}

export default function Sidebar({ collapsed, onToggle }) {
  const { conversations, newConversation, searchQuery, searchResults, isSearching, handleSearch, loading, exportChat, currentConversation } = useChat();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showMerge, setShowMerge] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const displayList = searchQuery.trim() ? searchResults : conversations;
  const groups = groupByDate(displayList);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); newConversation(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); onToggle?.(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "L") { e.preventDefault(); toggleTheme(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "e") { e.preventDefault(); if (currentConversation) exportChat("markdown"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [newConversation, onToggle, toggleTheme, currentConversation, exportChat]);

  if (collapsed) {
    return (
      <aside className="sidebar sidebar-collapsed">
        <button className="new-chat-btn" onClick={() => newConversation()} title="New chat (Ctrl+K)" style={{ margin: "12px auto", display: "flex" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button className="sidebar-icon-btn" onClick={onToggle} title="Expand sidebar (Ctrl+B)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        </button>
        <button className="sidebar-icon-btn" onClick={toggleTheme} title="Toggle theme (Ctrl+Shift+L)">
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
        <button className="sidebar-icon-btn" onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </aside>
    );
  }

  return (
    <>
      <aside className="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <TigerIcon size={24} />
            <span className="brand-name">Tiger AI</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="sidebar-icon-btn small" onClick={onToggle} title="Collapse (Ctrl+B)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
            </button>
            <button className="new-chat-btn" onClick={() => newConversation()} title="New chat (Ctrl+K)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search chats…" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
          {isSearching && <span className="spinner-sm dark" />}
        </div>

        {/* Actions */}
        <div className="sidebar-actions">
          <button className="merge-btn" onClick={() => setShowMerge(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <path d="M6 9v3a3 3 0 0 0 3 3h3"/>
            </svg>
            Merge Chats
          </button>
        </div>

        {/* Starred messages filter hint */}
        {conversations.length > 0 && (
          <div style={{ padding: "0 10px 6px", fontSize: 11, color: "var(--text-4)" }}>
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Conversation list */}
        <div className="conversation-list">
          {loading && conversations.length === 0 ? (
            <div className="sidebar-empty">Loading…</div>
          ) : displayList.length === 0 ? (
            <div className="sidebar-empty">
              {searchQuery ? `No results for "${searchQuery}"` : "No chats yet.\nClick + to start."}
            </div>
          ) : (
            Object.entries(groups).map(([label, items]) =>
              items.length > 0 ? (
                <div className="conv-section" key={label}>
                  <div className="conv-section-label">{label}</div>
                  {items.map((c) => <ConversationItem key={c._id} conversation={c} />)}
                </div>
              ) : null
            )
          )}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.avatar ? <img src={user.avatar} alt={user.name} /> : getInitials(user?.name)}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="sidebar-icon-btn small" onClick={toggleTheme} title="Toggle theme (Ctrl+Shift+L)">
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
            <button className="sidebar-icon-btn small" onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
            <button className="logout-btn" onClick={logout} title="Sign out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {showMerge    && <MergeModal    onClose={() => setShowMerge(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
