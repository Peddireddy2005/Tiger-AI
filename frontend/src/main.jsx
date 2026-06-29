import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { ThemeProvider } from "./context/ThemeContext";
import { startKeepAlive } from "./services/keepAlive";
import "./styles/index.css";

// Restore persisted settings on load
const savedFont = localStorage.getItem("tiger-font-size");
if (savedFont) document.documentElement.style.setProperty("--chat-font-size", savedFont);
const savedCompact = localStorage.getItem("tiger-compact");
if (savedCompact) document.documentElement.setAttribute("data-compact", savedCompact);

startKeepAlive();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
