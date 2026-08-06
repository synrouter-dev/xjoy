/**
 * Streaming Chat API endpoint.
 *
 * POST /api/chat/stream
 *
 * Same retrieval pipeline as /api/chat, but streams the LLM response
 * as Server-Sent Events for lower perceived latency.
 *
 * SSE event types:
 *   - text:     Chunk of the AI response text
 *   - done:     Stream complete, with citations and metadata
 *   - error:    Something went wrong
 *
 * Request body:
 *   { query: string, conversationId?: string }
 *
 * Response (text/event-stream):
 *   data: {"type":"text","content":"..."}\n\n
 *   data: {"type":"done","citations":[...],"conversationId":"...","contextVerseCount":N}\n\n
 */

import { retrieveVerses, buildPrompt, parseResponse } from "@/lib/rag";
import { streamResponse } from "@/lib/claude";
import {
  createConversation,
  addMessage,
  getConversation,
  getMessages,
  updateConversationTitle,
} from "@/lib/db";
import type { VerseCitation } from "@/lib/rag";

export const runtime = "nodejs";

// ── Request Validation ────────────────────────────────────────────────────────

interface ChatRequest {
  query: string;
  conversationId?: string;
}

function validateRequest(body: unknown): ChatRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object");
  }

  const { query, conversationId } = body as Record<string, unknown>;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    throw new Error("'query' is required and must be a non-empty string");
  }

  if (query.trim().length > 1000) {
    throw new Error("'query' must be under 1000 characters");
  }

  if (
    conversationId !== undefined &&
    (typeof conversationId !== "string" || conversationId.length === 0)
  ) {
    throw new Error("'conversationId' must be a non-empty string if provided");
  }

  return { query: query.trim(), conversationId };
}

// ── Prompt Injection Sanitization ─────────────────────────────────────────────

function sanitizeQuery(query: string): string {
  return query
    .replace(/\[SYSTEM\]/gi, "[SYS]")
    .replace(/\[ASSISTANT\]/gi, "[ASST]")
    .replace(/<system>/gi, "<sys>")
    .replace(/<\/?system_prompt>/gi, "")
    .slice(0, 1000);
}

// ── Conversation Title Generation ─────────────────────────────────────────────

function generateTitle(query: string): string {
  const cleaned = query.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 50) return cleaned;
  return cleaned.slice(0, 47) + "...";
}

// ── SSE Helpers ───────────────────────────────────────────────────────────────

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Parse and validate request
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(sseEvent({ type: "error", message: "Invalid JSON in request body" }), {
      status: 400,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  let chatRequest: ChatRequest;
  try {
    chatRequest = validateRequest(body);
  } catch (err) {
    return new Response(
      sseEvent({
        type: "error",
        message: err instanceof Error ? err.message : "Invalid request",
      }),
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const { query, conversationId } = chatRequest;
  const sanitizedQuery = sanitizeQuery(query);

  // Create a ReadableStream for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        // ── 1. Retrieve relevant verses ──
        const contextVerses = await retrieveVerses(sanitizedQuery);

        // ── 2. Load conversation history if continuing ──
        let history: { role: "user" | "assistant"; content: string }[] = [];
        let convId = conversationId;

        if (convId) {
          const existingConv = await getConversation(convId);
          if (!existingConv) {
            enqueue({ type: "error", message: "Conversation not found" });
            controller.close();
            return;
          }
          const messages = await getMessages(convId);
          history = messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));
        } else {
          const conv = await createConversation(generateTitle(sanitizedQuery));
          convId = conv.id;
        }

        // ── 3. Build the prompt ──
        const { systemPrompt, userMessage } = buildPrompt(
          sanitizedQuery,
          contextVerses,
          history.length > 0 ? history : undefined
        );

        // ── 4. Save user message ──
        if (convId) {
          await addMessage(convId, "user", sanitizedQuery);
        }

        // ── 5. Stream response ──
        let fullResponse = "";
        for await (const chunk of streamResponse(systemPrompt, userMessage, {
          maxTokens: 2048,
          temperature: 0.3,
        })) {
          fullResponse += chunk;
          enqueue({ type: "text", content: chunk });
        }

        // ── 6. Parse citations and check fabrications ──
        const { answer, citations, fabricationWarning } = parseResponse(
          fullResponse,
          contextVerses
        );

        if (fabricationWarning?.detected) {
          console.warn(
            "Fabrication warning: suspect passages detected in streaming response",
            { count: fabricationWarning.suspectPassages.length }
          );
        }

        // ── 7. Save assistant message ──
        if (convId) {
          await addMessage(convId, "assistant", answer, citations);
        }

        // ── 8. Update conversation title if first exchange ──
        if (convId && history.length === 0) {
          try {
            await updateConversationTitle(convId, generateTitle(sanitizedQuery));
          } catch {
            // Non-critical
          }
        }

        // ── 9. Send done event with metadata ──
        enqueue({
          type: "done",
          citations: citations.map((c: VerseCitation) => ({
            book: c.book,
            chapter: c.chapter,
            verse: c.verse,
            text: c.text,
          })),
          conversationId: convId,
          contextVerseCount: contextVerses.length,
          ...(fabricationWarning?.detected
            ? { fabricationWarning: fabricationWarning.suspectPassages }
            : {}),
        });

        controller.close();
      } catch (err) {
        console.error("Streaming chat API error:", err);

        if (err instanceof Error) {
          if (err.message.includes("ANTHROPIC_API_KEY")) {
            enqueue({
              type: "error",
              message:
                "AI service is not configured. Please set the ANTHROPIC_API_KEY environment variable.",
            });
          } else if (
            err.message.includes("DATABASE_URL") ||
            err.message.includes("connect") ||
            err.message.includes("ECONNREFUSED")
          ) {
            enqueue({
              type: "error",
              message:
                "Database is not available. Please ensure DATABASE_URL is set and the database is running.",
            });
          } else {
            enqueue({
              type: "error",
              message: "An internal error occurred. Please try again.",
            });
          }
        } else {
          enqueue({
            type: "error",
            message: "An internal error occurred. Please try again.",
          });
        }

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
