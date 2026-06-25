const BACKEND_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3001";

export const pingBackend = async () => {
  try {
    await fetch(`${BACKEND_URL}/health`);
  } catch {
    // backend still waking up — silently ignore
  }
};

export const startKeepAlive = () => {
  pingBackend();
  setInterval(pingBackend, 9 * 60 * 1000);
};