import { useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import MessageBubble from "./MessageBubble";
import AuraIcon from "../common/AuraIcon";

const SUGGESTIONS = [
  { icon: "💻", text: "Write a React component" },
  { icon: "🔬", text: "Research a topic in depth" },
  { icon: "📚", text: "Explain a concept simply" },
  { icon: "🎯", text: "Practice interview questions" },
  { icon: "✍️", text: "Help me write something" },
  { icon: "🐛", text: "Debug my code" },
];

const MODE_WELCOME = {
  general:   { title: "What's on your mind?", sub: "Ask me anything, attach files, or pick a suggestion below." },
  coding:    { title: "Coding Mode", sub: "Write, review and debug code with expert guidance." },
  research:  { title: "Research Mode", sub: "Structured, sourced analysis on any topic." },
  learning:  { title: "Learning Mode", sub: "Step-by-step explanations with examples." },
  interview: { title: "Interview Mode", sub: "Practice questions with real feedback." },
};

export default function ChatWindow() {
  const { messages, isGenerating, currentConversation, sendChatMessage, newConversation } = useChat();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const mode = currentConversation?.mode || "general";
  const welcome = MODE_WELCOME[mode] || MODE_WELCOME.general;

  const handleSuggestion = async (text) => {
    let convId = currentConversation?._id;
    if (!convId) {
      const conv = await newConversation();
      if (!conv) return;
      convId = conv._id;
    }
    await sendChatMessage(text, [], convId);
  };

  return (
    <div className="chat-window">
      {messages.length === 0 && (
        <div className="empty-chat">
          <div className="empty-icon"><AuraIcon size={64} /></div>
          <h2>{welcome.title}</h2>
          <p>{welcome.sub}</p>
          {!currentConversation && (
            <div className="suggestion-grid">
              {SUGGESTIONS.map((s) => (
                <button key={s.text} className="suggestion-chip" onClick={() => handleSuggestion(s.text)}>
                  <span className="suggestion-chip-icon">{s.icon}</span>
                  <span className="suggestion-chip-text">{s.text}</span>
                </button>
              ))}
            </div>
          )}
          {currentConversation && (
            <div className="mode-badge">{mode.charAt(0).toUpperCase() + mode.slice(1)} mode active</div>
          )}
        </div>
      )}
      <div className="messages-wrap">
        {messages.map((msg) => <MessageBubble key={msg._id} message={msg} />)}
        {isGenerating && (
          <div className="message assistant">
            <div className="msg-avatar aura-av"><AuraIcon size={32} /></div>
            <div className="msg-body">
              <div className="assistant-card">
                <div className="typing-dots"><span /><span /><span /></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}