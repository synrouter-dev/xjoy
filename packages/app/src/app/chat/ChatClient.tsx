"use client";

/**
 * Chat client component.
 *
 * Provides the full chat experience: message list, input, loading state,
 * citation display, and error handling.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import type { VerseCitation } from "@xjoy/shared";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: VerseCitation[];
}

// ── Sample Questions ──────────────────────────────────────────────────────────

const SAMPLE_QUESTIONS = [
  "圣经对爱有什么教导？",
  "请解释诗篇 23 篇的背景。",
  "保罗在罗马书中如何描述信心？",
  "耶稣如何教导宽恕？",
];

// ── Components ────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}

function BibleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <path d="M12 6v12" />
      <path d="M8 12h8" />
    </svg>
  );
}

function CitationCard({ citation }: { citation: VerseCitation }) {
  return (
    <div className="mt-2 px-3 py-2 rounded-md bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm">
      <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-0.5">
        {citation.book} {citation.chapter}:{citation.verse}
      </p>
      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
        &ldquo;{citation.text}&rdquo;
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <BibleIcon />
        </div>
      )}

      <div className={`flex-1 ${isUser ? "max-w-[85%]" : "max-w-[90%]"}`}>
        <div
          className={`px-4 py-3 rounded-lg ${
            isUser
              ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 ml-auto"
              : "bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800"
          }`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>

          {message.citations && message.citations.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wide">
                经文引用
              </p>
              {message.citations.map((c, i) => (
                <CitationCard key={i} citation={c} />
              ))}
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-neutral-800 dark:bg-neutral-200 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-medium text-white dark:text-neutral-900">
            我
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main Chat Component ───────────────────────────────────────────────────────

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (text?: string) => {
      const query = (text ?? input).trim();
      if (!query || isLoading) return;

      // Clear input and error
      setInput("");
      setError(null);

      // Add user message optimistically
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: query,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Create a placeholder for the streaming assistant message
      const assistantId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            conversationId: conversationId ?? undefined,
          }),
        });

        if (!response.ok) {
          // Try to read an error from the SSE stream
          const text = await response.text();
          let message = `Request failed (${response.status})`;
          try {
            const lines = text.split("\n").filter((l) => l.startsWith("data: "));
            for (const line of lines) {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.type === "error") message = parsed.message;
            }
          } catch {
            // Use the default error message
          }
          throw new Error(message);
        }

        // Read the SSE stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep the last partial line in buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case "text":
                  fullContent += data.content;
                  // Update the streaming message in place
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullContent }
                        : m
                    )
                  );
                  break;

                case "done":
                  // Finalize with citations
                  if (data.conversationId) {
                    setConversationId(data.conversationId);
                  }
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullContent, citations: data.citations }
                        : m
                    )
                  );
                  break;

                case "error":
                  throw new Error(data.message);
              }
            } catch (err) {
              if (err instanceof Error && err.message !== "Unexpected token") {
                throw err;
              }
              // Skip parse errors on partial chunks
            }
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        // Remove the empty assistant message on error
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, conversationId]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleSampleClick = useCallback(
    (question: string) => {
      handleSubmit(question);
    },
    [handleSubmit]
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
              <BibleIcon />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              经文问答
            </h2>
            <p className="text-neutral-500 dark:text-neutral-500 max-w-md mb-8 leading-relaxed">
              提出任何关于圣经的问题。回答基于 KJV 文本——
              从不编造，每条回复都有经文出处。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSampleClick(q)}
                  disabled={isLoading}
                  className="text-left px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-400 hover:border-amber-300 dark:hover:border-amber-700 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message list */
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BibleIcon />
                </div>
                <div className="flex-1 max-w-[90%]">
                  <div className="px-4 py-3 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
                <p className="font-medium mb-1">出错了</p>
                <p>{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 pt-4 pb-6 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题…"
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 disabled:opacity-50"
            autoComplete="off"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading || !input.trim()}
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity disabled:opacity-30 flex-shrink-0"
            aria-label="发送消息"
          >
            <SendIcon />
          </button>
        </div>

        <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-2 text-center">
          AI 回答基于 KJV 文本。重要事项请以个人研经为准。
        </p>
      </div>
    </div>
  );
}
