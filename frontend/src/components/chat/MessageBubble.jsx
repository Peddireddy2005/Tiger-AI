import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import TigerIcon from "../common/TigerIcon";
import { useAuth } from "../../context/AuthContext";

const codeTheme = {
  'code[class*="language-"]': { color: "#cdd6f4", background: "none", fontFamily: '"Menlo","Monaco","Consolas",monospace', fontSize: "13px", lineHeight: "1.6" },
  'pre[class*="language-"]': { background: "#1e1e2e", padding: "16px", margin: 0, overflow: "auto" },
  comment: { color: "#6c7086" }, punctuation: { color: "#cdd6f4" },
  keyword: { color: "#cba6f7", fontWeight: "500" }, string: { color: "#a6e3a1" },
  number: { color: "#fab387" }, boolean: { color: "#fab387" },
  function: { color: "#89b4fa" }, "class-name": { color: "#f38ba8" },
  operator: { color: "#89dceb" }, variable: { color: "#cdd6f4" },
  property: { color: "#89b4fa" }, tag: { color: "#f38ba8" },
  "attr-name": { color: "#fab387" }, "attr-value": { color: "#a6e3a1" },
};

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return <button className="code-copy-btn" onClick={copy}>{copied ? "✓ Copied" : "Copy"}</button>;
}

const mdComponents = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");
    const isBlock = match || code.includes("\n"); // detect block by content, not the removed `inline` prop
    if (isBlock) {
      return (
        <div className="code-block">
          <div className="code-header">
            <span className="code-lang">{match ? match[1] : "text"}</span>
            <CopyBtn text={code} />
          </div>
          <SyntaxHighlighter
            style={codeTheme}
            language={match ? match[1] : "text"}
            PreTag="div"
            useInlineStyles
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }
    return <code className="inline-code" {...props}>{children}</code>;
  },
  table({ children }) { return <div className="table-wrap"><table>{children}</table></div>; },
};

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";
}

function AttachmentPreview({ att }) {
  if (att.type === "image" && att.data) {
    return <img src={att.data} alt={att.name} className="msg-img-attachment" />;
  }
  return (
    <div className="msg-file-attachment">
      <span className="msg-file-icon">{att.mimeType === "application/pdf" ? "📄" : att.type === "text" ? "📝" : "📎"}</span>
      <div className="msg-file-info">
        <span className="msg-file-name">{att.name}</span>
        <span className="msg-file-size">{att.size ? `${(att.size / 1024).toFixed(1)} KB` : ""}</span>
      </div>
    </div>
  );
}

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const isUser = message.role === "user";
  const copy = async () => { await navigator.clipboard.writeText(message.content); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className={`message ${isUser ? "user" : "assistant"}`}>
      {!isUser && (
        <div className="msg-avatar tiger-av"><TigerIcon size={32} /></div>
      )}
      <div className="msg-body">
        {isUser ? (
          <div className="user-bubble">
            {/* Show actual file previews */}
            {message.attachments?.length > 0 && (
              <div className="msg-attachments">
                {message.attachments.map((att, i) => <AttachmentPreview key={i} att={att} />)}
              </div>
            )}
            {message.content && <div className="user-text">{message.content}</div>}
          </div>
        ) : (
          <div className="assistant-card">
            <div className="assistant-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        )}
        <div className="msg-actions">
          <button className="msg-act-btn" onClick={copy}>
            {copied ? "✓" : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
            {copied ? "Copied" : "Copy"}
          </button>
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