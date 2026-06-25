import { useState } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import ConversationItem from "../conversation/ConversationItem";
import MergeModal from "../modals/MergeModal";
import AuraIcon from "../common/AuraIcon";

function groupByDate(conversations) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const week = new Date(today); week.setDate(week.getDate() - 7);
  const month = new Date(today); month.setDate(month.getDate() - 30);
  const groups = { Pinned: [], Today: [], Yesterday: [], "Previous 7 Days": [], "Previous 30 Days": [], Older: [] };
  conversations.forEach((c) => {
    if (c.pinned) { groups.Pinned.push(c); return; }
    const d = new Date(c.updatedAt);
    if (d >= today) groups.Today.push(c);
    else if (d >= yesterday) groups.Yesterday.push(c);
    else if (d >= week) groups["Previous 7 Days"].push(c);
    else if (d >= month) groups["Previous 30 Days"].push(c);
    else groups.Older.push(c);
  });
  return groups;
}

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";
}

export default function Sidebar() {
  const { conversations, newConversation, searchQuery, searchResults, isSearching, handleSearch, loading } = useChat();
  const { user, logout } = useAuth();
  const [showMerge, setShowMerge] = useState(false);
  const displayList = searchQuery.trim() ? searchResults : conversations;
  const groups = groupByDate(displayList);

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand"><AuraIcon size={26} /><span className="brand-name">Aura</span></div>
          <button className="new-chat-btn" onClick={() => newConversation()} title="New chat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <div className="sidebar-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search chats..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
          {isSearching && <span className="spinner-sm dark" />}
        </div>

        <div className="sidebar-actions">
          <button className="merge-btn" onClick={() => setShowMerge(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <path d="M6 9v3a3 3 0 0 0 3 3h3"/>
            </svg>
            Merge Chats
          </button>
        </div>

        <div className="conversation-list">
          {loading && conversations.length === 0 ? (
            <div className="sidebar-empty">Loading...</div>
          ) : displayList.length === 0 ? (
            <div className="sidebar-empty">{searchQuery ? "No results" : "No chats yet.\nClick + to start."}</div>
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
          <button className="logout-btn" onClick={logout} title="Sign out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>
      {showMerge && <MergeModal onClose={() => setShowMerge(false)} />}
    </>
  );
}