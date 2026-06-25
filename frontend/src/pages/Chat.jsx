import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import BackendWakeup from "../components/common/BackendWakeup";

export default function Chat() {
  return (
    <div className="chat-layout">
      <Sidebar />
      <main className="chat-main">
        <BackendWakeup />
        <Topbar />
        <ChatWindow />
        <ChatInput />
      </main>
    </div>
  );
}