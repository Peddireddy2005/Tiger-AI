import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "../../context/ChatContext";

const ACCEPTED = "image/*,.pdf,.txt,.md,.js,.jsx,.ts,.tsx,.py,.json,.csv,.html,.css,.sh,.yaml,.yml,.xml";
const MAX_FILES = 5;

const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ChatInput() {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordError, setRecordError] = useState("");
  const { sendChatMessage, stopGeneration, isGenerating, currentConversation, newConversation } = useChat();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [message]);

  // Focus shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleFileSelect = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const newFiles = await Promise.all(
      selected.slice(0, MAX_FILES - files.length).map(async (file) => ({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        name: file.name, mimeType: file.type, size: file.size,
      }))
    );
    setFiles((prev) => [...prev, ...newFiles].slice(0, MAX_FILES));
    e.target.value = "";
  };

  const removeFile = (idx) => {
    setFiles((prev) => {
      const next = [...prev];
      if (next[idx]?.preview) URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  };

  const handleSubmit = useCallback(async () => {
    const content = message.trim();
    if ((!content && files.length === 0) || isGenerating) return;

    setMessage("");
    const filesToSend = [...files];
    setFiles([]);

    const attachments = await Promise.all(
      filesToSend.map(async (f) => ({
        name: f.name, mimeType: f.mimeType, size: f.size,
        base64: await readFileAsBase64(f.file),
        type: f.mimeType.startsWith("image/") ? "image" : "other",
        data: f.preview || null,
      }))
    );
    filesToSend.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });

    let convId = currentConversation?._id;
    if (!convId) {
      const conv = await newConversation();
      if (!conv) return;
      convId = conv._id;
    }
    await sendChatMessage(content, attachments, convId);
  }, [message, files, isGenerating, currentConversation, newConversation, sendChatMessage]);

  const sendKey = localStorage.getItem("tiger-send-key") || "Enter";

  const handleKeyDown = (e) => {
    if (sendKey === "Enter") {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    } else {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSubmit(); }
    }
    if (e.key === "Escape" && isGenerating) { e.preventDefault(); stopGeneration(); }
  };

  const toggleVoice = async () => {
    setRecordError("");
    if (isRecording) { mediaRecorderRef.current?.stop(); setIsRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr; chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); setRecordError("Voice recorded — connect a transcription API to enable this feature."); setTimeout(() => setRecordError(""), 4000); };
      mr.start(); setIsRecording(true);
    } catch (err) { setRecordError(err.name === "NotAllowedError" ? "Microphone access denied." : "Could not start recording."); }
  };

  const canSend = (message.trim().length > 0 || files.length > 0) && !isGenerating;

  return (
    <div className="input-area">
      <div className={`input-wrap ${isGenerating ? "busy" : ""}`}>
        {files.length > 0 && (
          <div className="file-previews">
            {files.map((f, i) => (
              <div className="file-preview-chip" key={i}>
                {f.preview
                  ? <img src={f.preview} alt={f.name} className="file-preview-img" />
                  : <div className="file-preview-icon">{f.mimeType === "application/pdf" ? "📄" : "📎"}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="file-preview-name">{f.name.length > 14 ? f.name.slice(0, 14) + "…" : f.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-4)" }}>{f.size < 1024*1024 ? `${(f.size/1024).toFixed(0)} KB` : `${(f.size/1024/1024).toFixed(1)} MB`}</div>
                </div>
                <button className="file-preview-remove" onClick={() => removeFile(i)}>×</button>
              </div>
            ))}
          </div>
        )}

        <div className="input-box">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={isGenerating ? "Tiger is thinking… (Esc to stop)" : "Ask Tiger anything…"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={false}
          />
          {isGenerating ? (
            <button className="stop-btn" onClick={stopGeneration} title="Stop generation (Esc)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </button>
          ) : (
            <button className="send-btn" onClick={handleSubmit} disabled={!canSend}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>

        <div className="input-toolbar">
          <div className="input-toolbar-left">
            <input ref={fileInputRef} type="file" multiple accept={ACCEPTED} style={{ display: "none" }} onChange={handleFileSelect} />
            <button className="toolbar-btn" onClick={() => fileInputRef.current?.click()} disabled={files.length >= MAX_FILES} title="Attach files">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              Attach {files.length > 0 && `(${files.length}/${MAX_FILES})`}
            </button>
            <button className={`toolbar-btn ${isRecording ? "recording" : ""}`} onClick={toggleVoice} title="Voice input">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </svg>
              {isRecording ? "Stop" : "Voice"}
            </button>
            {recordError && <span className="record-error">{recordError}</span>}
          </div>
          <span className="input-hint">
            {sendKey === "Enter" ? "Enter to send · Shift+Enter for new line" : "Ctrl+Enter to send · Enter for new line"}
          </span>
        </div>
      </div>
    </div>
  );
}
