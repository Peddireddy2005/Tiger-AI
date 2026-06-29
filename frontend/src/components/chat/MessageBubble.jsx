import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import TigerIcon from "../common/TigerIcon";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";

const codeTheme = {
  'code[class*="language-"]': { color:"#cdd6f4", background:"none", fontFamily:'"Menlo","Monaco","Consolas",monospace', fontSize:"13px", lineHeight:"1.65" },
  'pre[class*="language-"]': { background:"#0d1117", padding:"16px", margin:0, overflow:"auto" },
  comment:{ color:"#6c7086" }, punctuation:{ color:"#cdd6f4" },
  keyword:{ color:"#cba6f7", fontWeight:"500" }, string:{ color:"#a6e3a1" },
  number:{ color:"#fab387" }, boolean:{ color:"#fab387" }, function:{ color:"#89b4fa" },
  "class-name":{ color:"#f38ba8" }, operator:{ color:"#89dceb" }, variable:{ color:"#cdd6f4" },
  property:{ color:"#89b4fa" }, tag:{ color:"#f38ba8" },
  "attr-name":{ color:"#fab387" }, "attr-value":{ color:"#a6e3a1" },
};

function CopyBtn({ text, className = "code-copy-btn" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return <button className={className} onClick={copy}>{copied ? "✓ Copied" : "Copy"}</button>;
}

const mdComponents = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");
    const isBlock = match || code.includes("\n");
    if (isBlock) {
      return (
        <div className="code-block">
          <div className="code-header">
            <span className="code-lang">{match ? match[1] : "text"}</span>
            <CopyBtn text={code} />
          </div>
          <SyntaxHighlighter style={codeTheme} language={match ? match[1] : "text"} PreTag="div" useInlineStyles {...props}>
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }
    return <code className="inline-code" {...props}>{children}</code>;
  },
  table({ children }) { return <div className="table-wrap"><table>{children}</table></div>; },
  a({ href, children }) { return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>; },
};

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";
}

function AttachmentPreview({ att }) {
  if (att.type === "image" && att.data) {
    return <img src={att.data} alt={att.name} className="msg-img-attachment" onError={(e) => { e.target.style.display="none"; }} />;
  }
  return (
    <div className="msg-file-attachment">
      <span className="msg-file-icon">{att.mimeType === "application/pdf" ? "📄" : att.type === "text" ? "📝" : "📎"}</span>
      <div className="msg-file-info">
        <span className="msg-file-name">{att.name}</span>
        {att.size && <span className="msg-file-size">{att.size < 1024*1024 ? `${(att.size/1024).toFixed(1)} KB` : `${(att.size/1024/1024).toFixed(1)} MB`}</span>}
      </div>
    </div>
  );
}

export default function MessageBubble({ message, isStreaming = false }) {
  const { user } = useAuth();
  const { starMessage, regenerateLastResponse, messages } = useChat();
  const isUser = message.role === "user";
  const isLast = messages[messages.length - 1]?._id === message._id;
  const showTokens = localStorage.getItem("tiger-show-tokens") !== "false";

  const handleStar = useCallback(() => {
    starMessage(message._id, !message.starred);
  }, [message._id, message.starred, starMessage]);

  return (
    <div className={`message ${isUser ? "user" : "assistant"} ${isStreaming ? "streaming" : ""}`}>
      {!isUser && (
        <div className="msg-avatar tiger-av">
          <TigerIcon size={32} />
        </div>
      )}

      <div className="msg-body">
        {isUser ? (
          <div className="user-bubble">
            {message.attachments?.length > 0 && (
              <div className="msg-attachments">
                {message.attachments.map((att, i) => <AttachmentPreview key={i} att={att} />)}
              </div>
            )}
            {message.content && <div className="user-text">{message.content}</div>}
          </div>
        ) : (
          <div className={`assistant-card ${message.starred ? "starred" : ""}`}>
            <div className="assistant-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {message.content}
              </ReactMarkdown>
              {isStreaming && <span className="stream-cursor">▋</span>}
            </div>
            {showTokens && message.tokenUsage?.total > 0 && (
              <div className="token-badge">
                <span title="Prompt tokens">↑{message.tokenUsage.prompt}</span>
                <span style={{ color: "var(--text-4)" }}>·</span>
                <span title="Completion tokens">↓{message.tokenUsage.completion}</span>
                <span style={{ color: "var(--text-4)" }}>·</span>
                <span title="Total tokens">Σ{message.tokenUsage.total}</span>
              </div>
            )}
          </div>
        )}

        <div className="msg-actions">
          <CopyBtn text={message.content} className="msg-act-btn" />
          {!isUser && (
            <>
              <button
                className={`msg-act-btn ${message.starred ? "starred-btn" : ""}`}
                onClick={handleStar}
                title={message.starred ? "Unstar" : "Star this response"}
              >
                {message.starred ? "★ Starred" : "☆ Star"}
              </button>
              {isLast && !isStreaming && (
                <button className="msg-act-btn" onClick={regenerateLastResponse} title="Regenerate response">
                  🔄 Retry
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isUser && (
        <div className="msg-avatar user-av">
          {user?.avatar ? <img src={user.avatar} alt="" /> : getInitials(user?.name)}
        </div>
      )}
    </div>
  );
}
