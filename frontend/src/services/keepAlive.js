const BACKEND_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3001";

export const pingBackend = async () => {
  try {
    await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(4000) });
  } catch {
    // silently ignore — backend may still be waking up
  }
};

export const startKeepAlive = () => {
  pingBackend();
  // Ping every 9 minutes to prevent Render free tier sleep
  setInterval(pingBackend, 9 * 60 * 1000);
};
