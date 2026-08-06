import ChatClient from "./ChatClient";

export const metadata = {
  title: "AI 问答 — Xjoy",
  description:
    "就经文提出问题。基于 KJV 文本的回答——从不编造，每条回复都有经文引用。",
};

export default function ChatPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          AI 问答
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
          基于 KJV 经文的智能问答——回答忠实于原文，每条回复都有经文出处。
        </p>
      </div>
      <ChatClient />
    </div>
  );
}
