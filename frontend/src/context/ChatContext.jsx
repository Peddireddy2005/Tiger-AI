import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  createConversation, getConversations, getMessages, sendMessage,
  updateConversation, deleteConversation, searchConversations,
  mergeConversations, splitConversation, shareConversation,
} from "../api/chatApi";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

// FIX: named export only — fixes react-refresh/only-export-components
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
      console.error(err);
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

  const newConversation = async (options = {}) => {
    try {
      const res = await createConversation(options);
      setConversations((p) => [res.data, ...p]);
      setCurrentConversation(res.data);
      setMessages([]);
      return res.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const openConversation = async (conv) => {
    try {
      setCurrentConversation(conv);
      setMessages([]);
      const res = await getMessages(conv._id);
      setMessages(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

const sendChatMessage = async (content, attachments = [], convId = null) => {
  const id = convId || currentConversation?._id;
  if (!id || isGenerating) return;

  const tempId = `temp-${Date.now()}`;
  setMessages((p) => [
    ...p,
    { _id: tempId, role: "user", content, attachments, createdAt: new Date().toISOString() },
  ]);
  setIsGenerating(true);

  try {
    // only send what the backend actually needs
    const payloadAttachments = attachments.map(({ name, mimeType, size, base64 }) => ({ name, mimeType, size, base64 }));
    const res = await sendMessage({ conversationId: id, content, attachments: payloadAttachments });
    const { userMessage, assistantMessage, conversation } = res.data;
    setMessages((p) => [
      ...p.filter((m) => m._id !== tempId),
      userMessage,
      assistantMessage,
    ]);
    setConversations((p) => p.map((c) => c._id === conversation._id ? conversation : c));
    setCurrentConversation(conversation);
  } catch (err) {
    console.error(err);
    setMessages((p) => p.filter((m) => m._id !== tempId));
  } finally {
    setIsGenerating(false);
  }
};
  const renameChat = async (id, title) => {
    try {
      const res = await updateConversation(id, { title });
      setConversations((p) => p.map((c) => c._id === id ? res.data : c));
      if (currentConversation?._id === id) setCurrentConversation(res.data);
    } catch (err) { console.error(err); }
  };

  const deleteChat = async (id) => {
    try {
      await deleteConversation(id);
      setConversations((p) => p.filter((c) => c._id !== id));
      if (currentConversation?._id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (err) { console.error(err); }
  };

  const pinChat = async (id, pinned) => {
    try {
      const res = await updateConversation(id, { pinned });
      setConversations((p) => {
        const updated = p.map((c) => c._id === id ? res.data : c);
        return updated.sort(
          (a, b) =>
            (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
      if (currentConversation?._id === id) setCurrentConversation(res.data);
    } catch (err) { console.error(err); }
  };

  const changeMode = async (id, mode) => {
    try {
      const res = await updateConversation(id, { mode });
      setConversations((p) => p.map((c) => c._id === id ? res.data : c));
      if (currentConversation?._id === id) setCurrentConversation(res.data);
    } catch (err) { console.error(err); }
  };

  const changeModel = async (id, model) => {
    try {
      const res = await updateConversation(id, { model });
      setConversations((p) => p.map((c) => c._id === id ? res.data : c));
      if (currentConversation?._id === id) setCurrentConversation(res.data);
    } catch (err) { console.error(err); }
  };

  const mergeChats = async (sourceId, targetId) => {
    try {
      const res = await mergeConversations(sourceId, targetId);
      await loadConversations();
      if (
        currentConversation?._id === sourceId ||
        currentConversation?._id === targetId
      ) {
        setCurrentConversation(res.data.conversation);
        setMessages(res.data.messages);
      }
      return res.data;
    } catch (err) { console.error(err); throw err; }
  };

  const splitChat = async (convId, messageId) => {
    try {
      const res = await splitConversation(convId, messageId);
      await loadConversations();
      if (currentConversation?._id === convId) {
        const r = await getMessages(convId);
        setMessages(r.data || []);
      }
      return res.data;
    } catch (err) { console.error(err); throw err; }
  };

  const shareChat = async (id, share) => {
    try {
      const res = await shareConversation(id, share);
      setConversations((p) =>
        p.map((c) => c._id === id ? res.data.conversation : c)
      );
      if (currentConversation?._id === id) {
        setCurrentConversation(res.data.conversation);
      }
      return res.data;
    } catch (err) { console.error(err); throw err; }
  };

  const handleSearch = async (q) => {
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
  };

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

// FIX: export hook separately
export function useChat() {
  return useContext(ChatContext);
}