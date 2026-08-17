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
import { retrieveVerses, buildPrompt, parseResponse } from "@xjoy/api";
import { generateResponse } from "@xjoy/api";
import {
  createConversation,
  addMessage,
  getConversation,
  getMessages,
  updateConversationTitle,
} from "@xjoy/db";
import type { VerseCitation } from "@xjoy/api";

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

/**
 * The Anthropic SDK throws typed errors carrying a numeric `status`
 * (401 AuthenticationError, 403 PermissionDeniedError, 429 RateLimitError).
 * Proxy backends (e.g. DeepSeek) surface auth failures with messages that do
 * NOT contain the literal "ANTHROPIC_API_KEY", so we must match on status.
 */
function upstreamStatus(err: unknown): number | undefined {
  const status = (err as { status?: unknown })?.status;
  return typeof status === "number" ? status : undefined;
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

  // 跟踪数据库是否可用（用于优雅降级）
  let dbAvailable = true;

  try {
    // ── 1. Retrieve relevant verses (DB with local fallback) ──
    const contextVerses = await retrieveVerses(sanitizedQuery);

    // 检测是否使用了本地回退（检索成功但可能来自本地搜索）
    const usingLocalFallback = contextVerses.length > 0 &&
      contextVerses.every((v) => v.rank !== undefined);

    // ── 2. Load conversation history if continuing ──
    let history: { role: "user" | "assistant"; content: string }[] = [];
    let convId = conversationId;

    if (convId) {
      try {
        const existingConv = await getConversation(convId);
        if (!existingConv) {
          return errorResponse("Conversation not found", 404);
        }
        const messages = await getMessages(convId);
        history = messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      } catch (dbErr) {
        console.warn("[chat] 数据库不可用，无法加载对话历史");
        dbAvailable = false;
        // 继续执行但不加载历史记录
      }
    } else if (!usingLocalFallback) {
      try {
        // Create a new conversation
        const conv = await createConversation(generateTitle(sanitizedQuery));
        convId = conv.id;
      } catch (dbErr) {
        console.warn("[chat] 数据库不可用，无法创建对话记录");
        dbAvailable = false;
        convId = undefined;
      }
    }

    // ── 3. Build the prompt ──
    const { systemPrompt, userMessage } = buildPrompt(
      sanitizedQuery,
      contextVerses,
      history.length > 0 ? history : undefined
    );

    // ── 4. Save user message ──
    if (convId && dbAvailable) {
      try {
        await addMessage(convId, "user", sanitizedQuery);
      } catch {
        // 非关键——消息持久化失败不阻塞响应
      }
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
    if (convId && dbAvailable) {
      try {
        await addMessage(convId, "assistant", answer, citations);
      } catch {
        // 非关键——消息持久化失败不阻塞响应
      }
    }

    // ── 8. Update conversation title if this is the first exchange ──
    if (convId && dbAvailable && history.length === 0) {
      try {
        await updateConversationTitle(convId, generateTitle(sanitizedQuery));
      } catch {
        // 非关键——标题更新失败不阻塞响应
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
      conversationId: convId ?? null,
      contextVerseCount: contextVerses.length,
      ...(usingLocalFallback
        ? { dataSource: "local", note: "使用本地经文数据；对话历史未保存" }
        : {}),
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

      // 经文数据完全不可用（数据库 + 本地都失败）
      if (
        err.message.includes("经文检索不可用") ||
        err.message.includes("data/kjv.json")
      ) {
        return errorResponse(
          "经文数据不可用。请确认 Neon 数据库已连接，或 data/kjv.json 文件存在。",
          503
        );
      }
    }

    // 上游 LLM 认证/鉴权失败（key 无效或过期）——与代码缺陷区分，明确 502
    const status = upstreamStatus(err);
    if (status === 401 || status === 403) {
      return errorResponse(
        `AI 服务认证失败（上游 LLM 返回 ${status}）。请确认 ANTHROPIC_API_KEY 有效。`,
        502
      );
    }

    return errorResponse("An internal error occurred. Please try again.", 500);
  }
}
