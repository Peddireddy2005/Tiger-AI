import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TigerIcon from "../components/common/TigerIcon";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:3001";

const FEATURES = [
  { icon: "💬", title: "Smart Conversations", desc: "Context-aware AI that remembers" },
  { icon: "💻", title: "Code Assistant", desc: "Debug, write & explain code" },
  { icon: "🔬", title: "Research Mode", desc: "Structured deep-dive analysis" },
  { icon: "📚", title: "Learning Mode", desc: "Patient step-by-step teaching" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />

        <div className="auth-left-top">
          <div className="auth-left-logo">
            <TigerIcon size={32} />
            <span>Tiger AI</span>
          </div>
        </div>

        <div className="auth-left-center">
          <h1 className="auth-left-headline">
            Your AI.<br />
            <span className="grad">Supercharged.</span>
          </h1>
          <p className="auth-left-sub">
            One intelligent workspace for coding, research, learning and productivity — powered by the world's best AI models.
          </p>
          <div className="auth-feat-grid">
            {FEATURES.map((f) => (
              <div className="auth-feat-card" key={f.title}>
                <div className="auth-feat-icon">{f.icon}</div>
                <div className="auth-feat-title">{f.title}</div>
                <div className="auth-feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="auth-preview">
            <div className="auth-preview-label">Live example</div>
            <div className="auth-preview-msg">
              <div className="auth-preview-avatar user">me</div>
              <div className="auth-preview-text">Build me a REST API in Node.js with JWT auth</div>
            </div>
            <div className="auth-preview-msg">
              <div className="auth-preview-avatar tiger">✦</div>
              <div className="auth-preview-text tiger">I'll create a complete Express API with JWT authentication, bcrypt password hashing, protected routes, and best practices…</div>
            </div>
          </div>
        </div>

        <div className="auth-left-bottom">
          <div className="auth-trust">
            <span className="auth-trust-stars">★★★★★</span>
            <span>Trusted by developers, students and professionals</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-icon"><TigerIcon size={36} /></div>
            <span>Tiger AI</span>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your workspace</p>

          {(error || params.get("error")) && (
            <div className="auth-error">{error || "Google sign-in failed. Please try again."}</div>
          )}
          {params.get("verified") && (
            <div className="auth-success">✓ Email verified! Sign in below.</div>
          )}

          <button
            className="google-btn"
            onClick={() => { window.location.href = `${BACKEND_URL}/api/auth/google`; }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider"><span>or</span></div>

          <form onSubmit={handleSubmit} className="auth-form-inner">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required autoFocus
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="pw-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw((p) => !p)}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="spinner-sm" /> : "Sign in →"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
