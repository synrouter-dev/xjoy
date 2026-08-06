/**
 * Chat API endpoint.
 *
 * POST /api/chat
 *
 * Accepts a user query and optional conversation ID, runs the RAG pipeline,
 * and returns an AI response grounded in KJV scripture.
 *
 * Request body:
 *   { query: string, conversationId?: string }
 *
 * Response:
 *   { answer: string, citations: VerseCitation[], conversationId: string }
 */

import { NextResponse } from "next/server";
import { retrieveVerses, buildPrompt, parseResponse } from "@/lib/rag";
import { generateResponse } from "@/lib/claude";
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

/**
 * Strip anything that looks like an attempt to override the system prompt.
 * This is a simple defense-in-depth measure — the real safety comes from
 * the system prompt's grounding rules, which constrain the model regardless
 * of what the user says.
 */
function sanitizeQuery(query: string): string {
  return query
    .replace(/\[SYSTEM\]/gi, "[SYS]")
    .replace(/\[ASSISTANT\]/gi, "[ASST]")
    .replace(/<system>/gi, "<sys>")
    .replace(/<\/?system_prompt>/gi, "")
    .slice(0, 1000);
}

// ── Conversation Title Generation ─────────────────────────────────────────────

/**
 * Generate a short title for a new conversation based on the first query.
 */
function generateTitle(query: string): string {
  // Truncate and clean the query for use as a title
  const cleaned = query.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 50) return cleaned;
  return cleaned.slice(0, 47) + "...";
}

// ── Error Response Helper ─────────────────────────────────────────────────────

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Parse and validate request
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON in request body", 400);
  }

  let chatRequest: ChatRequest;
  try {
    chatRequest = validateRequest(body);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Invalid request",
      400
    );
  }

  const { query, conversationId } = chatRequest;
  const sanitizedQuery = sanitizeQuery(query);

  try {
    // ── 1. Retrieve relevant verses ──
    const contextVerses = await retrieveVerses(sanitizedQuery);

    // ── 2. Load conversation history if continuing ──
    let history: { role: "user" | "assistant"; content: string }[] = [];
    let convId = conversationId;

    if (convId) {
      const existingConv = await getConversation(convId);
      if (!existingConv) {
        return errorResponse("Conversation not found", 404);
      }
      const messages = await getMessages(convId);
      history = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
    } else {
      // Create a new conversation
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

    // ── 5. Generate response ──
    // maxTokens=1024: balances response quality with latency (<5s target).
    // Typical Bible study answers use ~600 tokens. Increase for deeper queries.
    const result = await generateResponse(systemPrompt, userMessage, {
      maxTokens: 1024,
      temperature: 0.3,
    });

    // ── 6. Parse citations and check for fabrications ──
    const { answer, citations, fabricationWarning } = parseResponse(
      result.content,
      contextVerses
    );

    // Log fabrication warnings for monitoring
    if (fabricationWarning?.detected) {
      console.warn(
        "Fabrication warning: suspect passages detected in response",
        { count: fabricationWarning.suspectPassages.length }
      );
    }

    // ── 7. Save assistant message ──
    if (convId) {
      await addMessage(convId, "assistant", answer, citations);
    }

    // ── 8. Update conversation title if this is the first exchange ──
    if (convId && history.length === 0) {
      try {
        // Use the first query as a title
        await updateConversationTitle(convId, generateTitle(sanitizedQuery));
      } catch {
        // Non-critical — title update can fail silently
      }
    }

    // ── 9. Return response ──
    return NextResponse.json({
      answer,
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
  } catch (err) {
    console.error("Chat API error:", err);

    // Distinguish between user-facing and internal errors
    if (err instanceof Error) {
      // API key not configured
      if (err.message.includes("ANTHROPIC_API_KEY")) {
        return errorResponse(
          "AI service is not configured. Please set the ANTHROPIC_API_KEY environment variable.",
          503
        );
      }

      // Database connection issues
      if (
        err.message.includes("DATABASE_URL") ||
        err.message.includes("connect") ||
        err.message.includes("ECONNREFUSED")
      ) {
        return errorResponse(
          "Database is not available. Please ensure DATABASE_URL is set and the database is running.",
          503
        );
      }
    }

    return errorResponse("An internal error occurred. Please try again.", 500);
  }
}
