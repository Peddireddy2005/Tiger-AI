import { useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import MessageBubble from "./MessageBubble";
import TigerIcon from "../common/TigerIcon";

const SUGGESTIONS = [
  { icon: "💻", text: "Write a React component for a data table with sorting" },
  { icon: "🔬", text: "Research the latest advances in quantum computing" },
  { icon: "📚", text: "Explain how transformers work in machine learning" },
  { icon: "🎯", text: "Practice a senior frontend engineer interview" },
  { icon: "✍️", text: "Help me write a compelling cover letter" },
  { icon: "🐛", text: "Debug this — my API returns 401 intermittently" },
];

const MODE_WELCOME = {
  general:   { title: "How can I help?",    sub: "Ask anything — code, research, writing, or attach files." },
  coding:    { title: "Coding Mode",         sub: "Write, review, debug and explain code with expert guidance." },
  research:  { title: "Research Mode",       sub: "Deep, structured analysis with sources and clear findings." },
  learning:  { title: "Learning Mode",       sub: "Patient, step-by-step explanations with real examples." },
  interview: { title: "Interview Mode",      sub: "Practice with real questions and get honest feedback." },
};

export default function ChatWindow() {
  const { messages, isGenerating, streamingContent, currentConversation, sendChatMessage, newConversation, tokenUsage } = useChat();
  const bottomRef = useRef(null);
  const windowRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating, streamingContent]);

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

  const showTokens = localStorage.getItem("tiger-show-tokens") !== "false";

  return (
    <div className="chat-window" ref={windowRef}>
      {messages.length === 0 && !isGenerating && (
        <div className="empty-chat">
          <div className="empty-icon"><TigerIcon size={60} /></div>
          <h2>{welcome.title}</h2>
          <p>{welcome.sub}</p>
          {!currentConversation ? (
            <div className="suggestion-grid">
              {SUGGESTIONS.map((s) => (
                <button key={s.text} className="suggestion-chip" onClick={() => handleSuggestion(s.text)}>
                  <span className="suggestion-chip-icon">{s.icon}</span>
                  <span className="suggestion-chip-text">{s.text}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mode-badge">{mode.charAt(0).toUpperCase() + mode.slice(1)} mode active</div>
          )}
        </div>
      )}

      <div className="messages-wrap">
        {messages.map((msg) => (
          <MessageBubble key={msg._id} message={msg} />
        ))}

        {/* Streaming message bubble */}
        {isGenerating && streamingContent && (
          <div className="message assistant">
            <div className="msg-avatar tiger-av"><TigerIcon size={32} /></div>
            <div className="msg-body">
              <div className="assistant-card">
                <div className="assistant-content">
                  <MessageBubble
                    message={{ _id: "streaming", role: "assistant", content: streamingContent }}
                    isStreaming
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator (before first token arrives) */}
        {isGenerating && !streamingContent && (
          <div className="message assistant">
            <div className="msg-avatar tiger-av"><TigerIcon size={32} /></div>
            <div className="msg-body">
              <div className="assistant-card">
                <div className="typing-dots"><span /><span /><span /></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Token usage summary bar */}
      {showTokens && tokenUsage?.total > 0 && !isGenerating && (
        <div className="token-summary-bar">
          <span>Last response —</span>
          <span>↑ {tokenUsage.prompt} prompt</span>
          <span>↓ {tokenUsage.completion} completion</span>
          <span>Σ {tokenUsage.total} total tokens</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
