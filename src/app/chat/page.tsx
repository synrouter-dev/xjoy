import { ScreenHeader } from "@/components/ScreenHeader";
import ChatClient from "./ChatClient";

export const metadata = {
  title: "Chat — Xjoy",
  description:
    "Ask questions about scripture. Grounded in the KJV text, faithful in every response.",
};

export default function ChatPage() {
  return (
    <div>
      <ScreenHeader
        title="Chat"
        description="Ask questions about scripture. Responses are grounded in the KJV text — never fabricated, always cited."
      />
      <ChatClient />
    </div>
  );
}
