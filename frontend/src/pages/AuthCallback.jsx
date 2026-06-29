import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const { loginWithTokenAndUser } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const p = new URLSearchParams(window.location.search);
    const token = p.get("token");
    const id = p.get("id");

    if (token && id) {
      loginWithTokenAndUser(token, {
        id,
        name: decodeURIComponent(p.get("name") || ""),
        email: decodeURIComponent(p.get("email") || ""),
        avatar: p.get("avatar") ? decodeURIComponent(p.get("avatar")) : null,
      });
      navigate("/", { replace: true });
    } else {
      navigate("/login?error=google_failed", { replace: true });
    }
  }, [loginWithTokenAndUser, navigate]);

  return (
    <div className="full-center">
      <div className="spinner" />
      <span style={{ color: "var(--text-3)", fontSize: 14 }}>Signing you in…</span>
    </div>
  );
}
