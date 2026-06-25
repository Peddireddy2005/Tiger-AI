import { useState, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3001";

export default function BackendWakeup() {
  const [sleeping, setSleeping] = useState(false);

  useEffect(() => {
    let attempts = 0;
    let timeoutId = null;

    const check = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          setSleeping(false);
          return;
        }
      } catch {
        // still waking up — no-op, handled below
      }

      attempts++;
      if (attempts >= 20) {
        setSleeping(false);
        return;
      }
      if (attempts === 2) setSleeping(true);
      timeoutId = setTimeout(check, 2000);
    };

    check();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (!sleeping) return null;

  return (
    <div className="wakeup-banner">
      <div className="wakeup-inner">
        <span className="wakeup-spinner" />
        <span>
          Backend is starting up (~30s on free tier).
          Your message will send automatically once ready.
        </span>
      </div>
    </div>
  );
}