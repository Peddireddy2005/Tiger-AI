import { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getConversations();
      setConversations(res.data || []);
    } catch (err) {
      console.error("loadConversations error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAll = useCallback(() => {
    setConversations([]);
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!user) {
        if (!cancelled) clearAll();
        return;
      }
      if (!cancelled) await loadConversations();
    };
    init();
    return () => { cancelled = true; };
  }, [user, loadConversations, clearAll]);

  // Creates a new conversation, sets it as active, and returns it.
  // Safe to call multiple times — always awaits the server response.
  const newConversation = useCallback(async (options = {}) => {
    try {
      const res = await createConversation(options);
      const conv = res.data;
      setConversations((prev) => [conv, ...prev]);
      setCurrentConversation(conv);
      setMessages([]);
      return conv;
    } catch (err) {
      console.error("newConversation error:", err);
      return null;
    }
  }, []);

  const openConversation = useCallback(async (conv) => {
    try {
      setCurrentConversation(conv);
      setMessages([]);
      const res = await getMessages(conv._id);
      setMessages(res.data || []);
    } catch (err) {
      console.error("openConversation error:", err);
    }
  }, []);

  const sendChatMessage = useCallback(async (content, attachments = [], convId = null) => {
    const id = convId || currentConversation?._id;
    if (!id || isGenerating) return;

    const tempId = `temp-${Date.now()}`;

    // Optimistic UI: show the user message immediately
    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        role: "user",
        content,
        // For display: keep preview URLs in optimistic message
        attachments: attachments.map(({ name, mimeType, size, type, data }) => ({
          name, mimeType, size, type, data,
        })),
        createdAt: new Date().toISOString(),
      },
    ]);
    setIsGenerating(true);

    try {
      // Only send what the backend needs (strip out blob preview URLs etc.)
      const payloadAttachments = attachments.map(({ name, mimeType, size, base64 }) => ({
        name, mimeType, size, base64,
      }));

      const res = await sendMessage({ conversationId: id, content, attachments: payloadAttachments });
      const { userMessage, assistantMessage, conversation } = res.data;

      setMessages((prev) => [
        ...prev.filter((m) => m._id !== tempId),
        userMessage,
        assistantMessage,
      ]);

      // Update the conversation in the sidebar (title may have changed)
      setConversations((prev) =>
        prev.map((c) => (c._id === conversation._id ? conversation : c))
      );
      setCurrentConversation(conversation);
    } catch (err) {
      console.error("sendChatMessage error:", err);
      // Roll back the optimistic message
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setIsGenerating(false);
    }
  }, [currentConversation, isGenerating]);

  const renameChat = useCallback(async (id, title) => {
    try {
      const res = await updateConversation(id, { title });
      setConversations((prev) => prev.map((c) => (c._id === id ? res.data : c)));
      if (currentConversation?._id === id) setCurrentConversation(res.data);
    } catch (err) { console.error(err); }
  }, [currentConversation]);

  const deleteChat = useCallback(async (id) => {
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (currentConversation?._id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (err) { console.error(err); }
  }, [currentConversation]);

  const pinChat = useCallback(async (id, pinned) => {
    try {
      const res = await updateConversation(id, { pinned });
      setConversations((prev) => {
        const updated = prev.map((c) => (c._id === id ? res.data : c));
        return updated.sort(
          (a, b) =>
            (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
      if (currentConversation?._id === id) setCurrentConversation(res.data);
    } catch (err) { console.error(err); }
  }, [currentConversation]);

  const changeMode = useCallback(async (id, mode) => {
    try {
      const res = await updateConversation(id, { mode });
      setConversations((prev) => prev.map((c) => (c._id === id ? res.data : c)));
      if (currentConversation?._id === id) setCurrentConversation(res.data);
    } catch (err) { console.error(err); }
  }, [currentConversation]);

  const changeModel = useCallback(async (id, model) => {
    try {
      const res = await updateConversation(id, { model });
      setConversations((prev) => prev.map((c) => (c._id === id ? res.data : c)));
      if (currentConversation?._id === id) setCurrentConversation(res.data);
    } catch (err) { console.error(err); }
  }, [currentConversation]);

  const mergeChats = useCallback(async (sourceId, targetId) => {
    try {
      const res = await mergeConversations(sourceId, targetId);
      await loadConversations();
      if (currentConversation?._id === sourceId || currentConversation?._id === targetId) {
        setCurrentConversation(res.data.conversation);
        setMessages(res.data.messages);
      }
      return res.data;
    } catch (err) { console.error(err); throw err; }
  }, [currentConversation, loadConversations]);

  const splitChat = useCallback(async (convId, messageId) => {
    try {
      const res = await splitConversation(convId, messageId);
      await loadConversations();
      if (currentConversation?._id === convId) {
        const r = await getMessages(convId);
        setMessages(r.data || []);
      }
      return res.data;
    } catch (err) { console.error(err); throw err; }
  }, [currentConversation, loadConversations]);

  const shareChat = useCallback(async (id, share) => {
    try {
      const res = await shareConversation(id, share);
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? res.data.conversation : c))
      );
      if (currentConversation?._id === id) setCurrentConversation(res.data.conversation);
      return res.data;
    } catch (err) { console.error(err); throw err; }
  }, [currentConversation]);

  const handleSearch = useCallback(async (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    try {
      setIsSearching(true);
      const res = await searchConversations(q);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return (
    <ChatContext.Provider value={{
      conversations, currentConversation, messages, loading,
      isGenerating, searchQuery, searchResults, isSearching,
      loadConversations, newConversation, openConversation,
      sendChatMessage, renameChat, deleteChat, pinChat,
      changeMode, changeModel, mergeChats, splitChat, shareChat, handleSearch,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}