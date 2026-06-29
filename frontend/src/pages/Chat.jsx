import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import BackendWakeup from "../components/common/BackendWakeup";
import { useChat } from "../context/ChatContext";

export default function Chat() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.innerWidth < 768 || localStorage.getItem("tiger-sidebar-collapsed") === "true"
  );
  const { regenerateLastResponse } = useChat();

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      localStorage.setItem("tiger-sidebar-collapsed", String(!prev));
      return !prev;
    });
  };

  // Global keyboard shortcut: Ctrl+R to regenerate
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "r" && !e.shiftKey) {
        // Only intercept if not in an input
        if (document.activeElement.tagName !== "TEXTAREA" && document.activeElement.tagName !== "INPUT") {
          e.preventDefault();
          regenerateLastResponse();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [regenerateLastResponse]);

  return (
    <div className={`chat-layout ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <main className="chat-main">
        <BackendWakeup />
        <Topbar onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
        <ChatWindow />
        <ChatInput />
      </main>
    </div>
  );
}
