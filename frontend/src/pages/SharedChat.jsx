import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getSharedChat } from "../api/chatApi";
import TigerIcon from "../components/common/TigerIcon";

export default function SharedChat() {
  const { shareId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSharedChat(shareId);
        setData(res.data);
      } catch { setError("This shared chat is no longer available."); }
      finally { setLoading(false); }
    };
    load();
  }, [shareId]);

  if (loading) return <div className="shared-loading"><div className="spinner" /></div>;
  if (error) return (
    <div className="shared-error">
      <TigerIcon size={48} />
      <h2>{error}</h2>
      <Link to="/login" className="shared-cta">Try Tiger AI →</Link>
    </div>
  );

  return (
    <div className="shared-page">
      <div className="shared-header">
        <div className="shared-brand"><TigerIcon size={28} /><span>Tiger AI</span></div>
        <div className="shared-meta">
          <span className="shared-title">{data.conversation.title}</span>
          <span className="shared-badge">Shared conversation</span>
        </div>
        <Link to="/register" className="shared-cta-small">Try Tiger AI free →</Link>
      </div>

      <div className="shared-messages">
        {data.messages.map((msg) => (
          <div key={msg._id} className={`shared-msg ${msg.role}`}>
            <div className="shared-msg-avatar">
              {msg.role === "assistant" ? <TigerIcon size={28} /> : <span>U</span>}
            </div>
            <div className="shared-msg-body">
              {msg.role === "assistant" ? (
                <div className="shared-assistant-card">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="shared-user-bubble">{msg.content}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="shared-footer">
        <p>Want to have conversations like this?</p>
        <Link to="/register" className="auth-submit-btn" style={{ display: "inline-flex", width: "auto", padding: "12px 32px" }}>
          Start for free →
        </Link>
      </div>
    </div>
  );
}