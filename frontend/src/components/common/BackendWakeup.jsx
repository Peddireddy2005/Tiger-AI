import { useState, useEffect } from "react";

const BACKEND_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3001";

export default function BackendWakeup() {
  const [sleeping, setSleeping] = useState(false);

  useEffect(() => {
    let attempts = 0;
    let timeoutId = null;
    let stopped = false;

    const check = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, {
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          if (!stopped) setSleeping(false);
          return;
        }
      } catch {
        // still waking up
      }

      attempts++;
      if (attempts >= 25 || stopped) {
        setSleeping(false);
        return;
      }
      if (attempts === 2) setSleeping(true);
      timeoutId = setTimeout(check, 2000);
    };

    check();
    return () => {
      stopped = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (!sleeping) return null;

  return (
    <div className="wakeup-banner">
      <div className="wakeup-inner">
        <span className="wakeup-spinner" />
        <span>
          Backend is starting up (~30s on free tier). Your message will send once ready.
        </span>
      </div>
    </div>
  );
}
