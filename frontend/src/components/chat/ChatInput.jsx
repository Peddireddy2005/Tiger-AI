import { useState, useRef, useEffect } from "react";
import { useChat } from "../../context/ChatContext";

const ACCEPTED = "image/*,.pdf,.txt,.md,.js,.jsx,.ts,.tsx,.py,.json,.csv,.html,.css,.sh,.yaml,.yml,.xml";

const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
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
  const { sendChatMessage, isGenerating, currentConversation, newConversation } = useChat();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [message]);

  const handleFileSelect = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const newFiles = await Promise.all(
      selected.slice(0, 5 - files.length).map(async (file) => {
        const isImage = file.type.startsWith("image/");
        const preview = isImage ? URL.createObjectURL(file) : null;
        return { file, preview, name: file.name, mimeType: file.type, size: file.size };
      })
    );
    setFiles((p) => [...p, ...newFiles].slice(0, 5));
    e.target.value = "";
  };

  const removeFile = (idx) => {
    setFiles((p) => {
      const next = [...p];
      if (next[idx].preview) URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  };

  const handleSubmit = async () => {
    const content = message.trim();
    if ((!content && files.length === 0) || isGenerating) return;
    setMessage("");

    // Read files as base64 for backend processing
    const attachments = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        base64: await readFileAsBase64(f.file),
      }))
    );
    setFiles([]);

    let convId = currentConversation?._id;
    if (!convId) {
      const conv = await newConversation();
      if (!conv) return;
      convId = conv._id;
    }
    await sendChatMessage(content, attachments, convId);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoice = async () => {
    setRecordError("");
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecordError("Voice recorded. Integrate Whisper API for transcription.");
        setTimeout(() => setRecordError(""), 4000);
      };
      mr.start();
      setIsRecording(true);
    } catch (err) {
      setRecordError(
        err.name === "NotAllowedError"
          ? "Microphone access denied."
          : "Could not start recording."
      );
    }
  };

  const canSend = (message.trim().length > 0 || files.length > 0) && !isGenerating;

  return (
    <div className="input-area">
      <div className={`input-wrap ${isGenerating ? "busy" : ""}`}>
        {files.length > 0 && (
          <div className="file-previews">
            {files.map((f, i) => (
              <div className="file-preview-chip" key={i}>
                {f.preview ? (
                  <img src={f.preview} alt={f.name} className="file-preview-img" />
                ) : (
                  <div className="file-preview-icon">
                    {f.mimeType === "application/pdf" ? "📄" : "📎"}
                  </div>
                )}
                <span className="file-preview-name">
                  {f.name.length > 16 ? f.name.slice(0, 16) + "…" : f.name}
                </span>
                <button className="file-preview-remove" onClick={() => removeFile(i)}>×</button>
              </div>
            ))}
          </div>
        )}

        <div className="input-box">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Ask Aura anything..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
          />
          <button
            className="send-btn"
            onClick={handleSubmit}
            disabled={!canSend}
          >
            {isGenerating ? (
              <span className="spinner-sm" />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>

        <div className="input-toolbar">
          <div className="input-toolbar-left">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED}
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <button
              className="toolbar-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || files.length >= 5}
              title="Attach files"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              Attach
            </button>
            <button
              className={`toolbar-btn ${isRecording ? "recording" : ""}`}
              onClick={toggleVoice}
              disabled={isGenerating}
              title="Voice input"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
              </svg>
              {isRecording ? "Stop" : "Voice"}
            </button>
            {recordError && (
              <span className="record-error">{recordError}</span>
            )}
          </div>
          <span className="input-hint">Enter · Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}