/**
 * Claude API integration.
 *
 * Wraps the Anthropic SDK to provide a clean interface for generating
 * Bible-grounded responses. Handles API key validation, streaming support,
 * and error recovery.
 */

import Anthropic from "@anthropic-ai/sdk";

// ── Client ────────────────────────────────────────────────────────────────────

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "sk-ant-...") {
      throw new Error(
        "ANTHROPIC_API_KEY is not set or is still the placeholder value. " +
          "Set it in .env.local to use the AI chat features."
      );
    }
    const baseURL = process.env.ANTHROPIC_BASE_URL;
    client = new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });
  }
  return client;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatOptions {
  /** Maximum tokens in the response. */
  maxTokens?: number;
  /** Temperature (0-1). Lower = more deterministic. */
  temperature?: number;
  /** Previous messages for conversation continuity. */
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface ChatResult {
  content: string;
  /** Token usage for monitoring costs. */
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ── Model ─────────────────────────────────────────────────────────────────────

/**
 * Resolve the default model based on the API provider.
 *
 * - Anthropic direct (no ANTHROPIC_BASE_URL override): uses claude-haiku-4-5
 *   for speed (~3-5s typical), satisfying the <5s latency target.
 * - Custom base URL (e.g., DeepSeek proxy): defaults to deepseek-chat.
 * - ANTHROPIC_MODEL env var always takes precedence.
 *
 * Latency note: DeepSeek proxy adds ~2-3s overhead vs Anthropic direct.
 * For production, use an Anthropic API key (sk-ant-...) without setting
 * ANTHROPIC_BASE_URL for the fastest responses.
 */
function getDefaultModel(): string {
  if (process.env.ANTHROPIC_MODEL) return process.env.ANTHROPIC_MODEL;
  // If using a custom base URL (e.g., DeepSeek), assume the provider's default chat model
  if (process.env.ANTHROPIC_BASE_URL) return "deepseek-chat";
  // Anthropic direct: use Haiku 4.5 for low latency
  return "claude-haiku-4-5-20251001";
}

const DEFAULT_MODEL = getDefaultModel();

// ── Generate ──────────────────────────────────────────────────────────────────

/**
 * Generate a response using Claude.
 *
 * Sends the system prompt (with embedded verse context) and user query.
 * Returns the generated text with token usage stats.
 */
export async function generateResponse(
  systemPrompt: string,
  userMessage: string,
  options: ChatOptions = {}
): Promise<ChatResult> {
  const c = getClient();
  const {
    maxTokens = 1024, // Conservative default for latency; override for longer responses
    temperature = 0.3, // Low temp for factual accuracy
    history = [],
  } = options;

  // Build messages array
  const messages: Anthropic.MessageParam[] = [];

  // Include conversation history if provided
  for (const msg of history) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Add the current user query
  messages.push({
    role: "user",
    content: userMessage,
  });

  const response = await c.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages,
  });

  // Extract text content
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );

  const content = textBlocks.map((block) => block.text).join("\n");

  return {
    content,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

// ── Streaming ─────────────────────────────────────────────────────────────────

/**
 * Generate a streaming response from Claude.
 *
 * Yields text chunks as they arrive. The caller is responsible for
 * accumulating the full response and extracting citations.
 */
export async function* streamResponse(
  systemPrompt: string,
  userMessage: string,
  options: ChatOptions = {}
): AsyncGenerator<string, void, undefined> {
  const c = getClient();
  const {
    maxTokens = 1024,
    temperature = 0.3,
    history = [],
  } = options;

  const messages: Anthropic.MessageParam[] = [];

  for (const msg of history) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  messages.push({
    role: "user",
    content: userMessage,
  });

  const stream = await c.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages,
    stream: true,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
