import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  createConversation, getConversations, getMessages, sendMessage,
  updateConversation, deleteConversation, searchConversations,
  mergeConversations, splitConversation, shareConversation,
} from "../api/chatApi";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [tokenUsage, setTokenUsage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [exportError, setExportError] = useState("");
  const abortRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getConversations();
      setConversations(res.data || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAll = useCallback(() => {
    setConversations([]);
    setCurrentConversation(null);
    setMessages([]);
    setSearchQuery("");
    setSearchResults([]);
    setTokenUsage(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!user) { if (!cancelled) clearAll(); return; }
      if (!cancelled) await loadConversations();
    };
    init();
    return () => { cancelled = true; };
  }, [user, loadConversations, clearAll]);

  const newConversation = async (options = {}) => {
    try {
      const res = await createConversation(options);
      setConversations((prev) => [res.data, ...prev]);
      setCurrentConversation(res.data);
      setMessages([]);
      setTokenUsage(null);
      return res.data;
    } catch (err) { console.error(err); return null; }
  };

  const openConversation = async (conv) => {
    try {
      setCurrentConversation(conv);
      setMessages([]);
      setTokenUsage(null);
      const res = await getMessages(conv._id);
      setMessages(res.data || []);
    } catch (err) { console.error(err); }
  };

  // STREAMING send — uses SSE
  const sendChatMessage = useCallback(async (content, attachments = [], convId) => {
    const id = convId || currentConversation?._id;
    if (!id || isGenerating) return;

    // Optimistic user message
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { _id: tempId, role: "user", content, attachments, createdAt: new Date().toISOString() }]);
    setIsGenerating(true);
    setStreamingContent("");
    setTokenUsage(null);

    const payloadAttachments = attachments.map(({ name, mimeType, size, base64 }) => ({ name, mimeType, size, base64 }));

    try {
      const token = localStorage.getItem("token");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

      const response = await fetch(`${apiBase}/messages/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId: id, content, attachments: payloadAttachments }),
        signal: (() => { const ctrl = new AbortController(); abortRef.current = ctrl; return ctrl.signal; })(),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Stream failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.type === "userMessage") {
              // Replace temp with real user message
              setMessages((prev) => prev.map((m) => m._id === tempId ? parsed.message : m));
            } else if (parsed.type === "delta") {
              accumulated += parsed.content;
              setStreamingContent(accumulated);
            } else if (parsed.type === "done") {
              setMessages((prev) => [...prev, parsed.assistantMessage]);
              setStreamingContent("");
              setConversations((prev) => prev.map((c) => c._id === parsed.conversation._id ? parsed.conversation : c));
              setCurrentConversation(parsed.conversation);
              if (parsed.tokenUsage?.total > 0) setTokenUsage(parsed.tokenUsage);
            } else if (parsed.type === "error") {
              throw new Error(parsed.message);
            }
          } catch (e) {
            if (e.message !== "Unexpected end of JSON input") console.error("SSE parse error:", e.message);
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // User stopped generation — keep partial content
        if (streamingContent) {
          setMessages((prev) => [...prev, { _id: `partial-${Date.now()}`, role: "assistant", content: streamingContent + "\n\n*[Generation stopped]*", createdAt: new Date().toISOString() }]);
        }
        setStreamingContent("");
      } else {
        console.error("sendChatMessage error:", err);
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        setStreamingContent("");
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [currentConversation?._id, isGenerating, streamingContent]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const regenerateLastResponse = useCallback(async () => {
    if (!currentConversation?._id || isGenerating) return;
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return;
    setMessages((prev) => prev.filter((m) => m._id !== lastAssistant._id));
    setIsGenerating(true);
    setStreamingContent("");
    try {
      const token = localStorage.getItem("token");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${apiBase}/messages/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId: currentConversation._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessages((prev) => [...prev, data.assistantMessage]);
      setCurrentConversation(data.conversation);
    } catch (err) { console.error("Regenerate error:", err); }
    finally { setIsGenerating(false); }
  }, [currentConversation?._id, isGenerating, messages]);

  const starMessage = useCallback(async (messageId, starred) => {
    try {
      const token = localStorage.getItem("token");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      await fetch(`${apiBase}/messages/${messageId}/react`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ starred }),
      });
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, starred } : m));
    } catch (err) { console.error(err); }
  }, []);

  // FIXED: previously this would call res.blob() even on a failed request,
  // silently downloading a tiny JSON-error file named like a real export.
  const exportChat = useCallback(async (format = "markdown") => {
    if (!currentConversation?._id) return;
    setExportError("");
    const token = localStorage.getItem("token");
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
    try {
      const res = await fetch(`${apiBase}/messages/export/${currentConversation._id}?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let message = "Export failed";
        try { message = (await res.json())?.message || message; } catch { /* non-JSON error body */ }
        throw new Error(message);
      }
      const blob = await res.blob();
      const ext = format === "markdown" ? "md" : "json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentConversation.title.replace(/[^a-z0-9]/gi, "_")}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      setExportError(err.message || "Export failed. Please try again.");
    }
  }, [currentConversation]);

  const renameChat   = async (id, title) => { try { const res = await updateConversation(id, { title }); setConversations((p) => p.map((c) => c._id === id ? res.data : c)); if (currentConversation?._id === id) setCurrentConversation(res.data); } catch (err) { console.error(err); } };
  const deleteChat   = async (id) => { try { await deleteConversation(id); setConversations((p) => p.filter((c) => c._id !== id)); if (currentConversation?._id === id) { setCurrentConversation(null); setMessages([]); } } catch (err) { console.error(err); } };
  const pinChat      = async (id, pinned) => { try { const res = await updateConversation(id, { pinned }); setConversations((p) => { const u = p.map((c) => c._id === id ? res.data : c); return u.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updatedAt) - new Date(a.updatedAt)); }); if (currentConversation?._id === id) setCurrentConversation(res.data); } catch (err) { console.error(err); } };
  const changeMode   = async (id, mode) => { try { const res = await updateConversation(id, { mode }); setConversations((p) => p.map((c) => c._id === id ? res.data : c)); if (currentConversation?._id === id) setCurrentConversation(res.data); } catch (err) { console.error(err); } };
  const changeModel  = async (id, model) => { try { const res = await updateConversation(id, { model }); setConversations((p) => p.map((c) => c._id === id ? res.data : c)); if (currentConversation?._id === id) setCurrentConversation(res.data); } catch (err) { console.error(err); } };
  const mergeChats   = async (sourceId, targetId) => { try { const res = await mergeConversations(sourceId, targetId); await loadConversations(); if (currentConversation?._id === sourceId || currentConversation?._id === targetId) { setCurrentConversation(res.data.conversation); setMessages(res.data.messages); } return res.data; } catch (err) { console.error(err); throw err; } };
  const splitChat    = async (convId, messageId) => { try { const res = await splitConversation(convId, messageId); await loadConversations(); if (currentConversation?._id === convId) { const r = await getMessages(convId); setMessages(r.data || []); } return res.data; } catch (err) { console.error(err); throw err; } };
  const shareChat    = async (id, share) => { try { const res = await shareConversation(id, share); setConversations((p) => p.map((c) => c._id === id ? res.data.conversation : c)); if (currentConversation?._id === id) setCurrentConversation(res.data.conversation); return res.data; } catch (err) { console.error(err); throw err; } };
  const handleSearch = async (q) => { setSearchQuery(q); if (!q.trim()) { setSearchResults([]); setIsSearching(false); return; } try { setIsSearching(true); const res = await searchConversations(q); setSearchResults(res.data || []); } catch (err) { console.error(err); } finally { setIsSearching(false); } };

  return (
    <ChatContext.Provider value={{
      conversations, currentConversation, messages, loading,
      isGenerating, streamingContent, tokenUsage,
      searchQuery, searchResults, isSearching,
      exportError,
      loadConversations, newConversation, openConversation,
      sendChatMessage, stopGeneration, regenerateLastResponse,
      starMessage, exportChat,
      renameChat, deleteChat, pinChat, changeMode, changeModel,
      mergeChats, splitChat, shareChat, handleSearch,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}