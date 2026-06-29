import api from "../services/axios";

export const createConversation  = (data = {}) => api.post("/conversations", data);
export const getConversations    = ()           => api.get("/conversations");
export const searchConversations = (q)          => api.get(`/conversations/search?q=${encodeURIComponent(q)}`);
export const updateConversation  = (id, data)   => api.put(`/conversations/${id}`, data);
export const deleteConversation  = (id)         => api.delete(`/conversations/${id}`);
export const mergeConversations  = (s, t)       => api.post("/conversations/merge", { sourceId: s, targetId: t });
export const splitConversation   = (id, msgId)  => api.post(`/conversations/${id}/split`, { messageId: msgId });
export const shareConversation   = (id, share)  => api.post(`/conversations/${id}/share`, { share });
export const getSharedChat       = (shareId)    => api.get(`/shared/${shareId}`);
export const sendMessage         = (data)       => api.post("/messages", data);
export const getMessages         = (id)         => api.get(`/messages/${id}`);
