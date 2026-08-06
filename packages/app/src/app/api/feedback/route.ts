/**
 * Feedback API endpoint.
 *
 * POST /api/feedback
 *
 * Accepts user feedback submissions during the initial testing phase.
 *
 * Request body:
 *   { category: string, rating?: number, comment: string, email?: string, pageUrl?: string }
 *
 * Response:
 *   { success: true, id: number }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  insertFeedback,
  getFeedback,
  getFeedbackSummary,
} from "@/lib/feedback-db";
import {
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
} from "@/lib/feedback-types";

export const runtime = "nodejs";

// ── Request Validation ──────────────────────────────────────────────────────────

interface FeedbackRequest {
  category: string;
  rating?: number;
  comment: string;
  email?: string;
  pageUrl?: string;
}

function validateRequest(body: unknown): FeedbackRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object");
  }

  const { category, rating, comment, email, pageUrl } =
    body as Record<string, unknown>;

  if (!category || typeof category !== "string") {
    throw new Error("'category' is required and must be a string");
  }

  if (!FEEDBACK_CATEGORIES.includes(category as FeedbackCategory)) {
    throw new Error(
      `'category' must be one of: ${FEEDBACK_CATEGORIES.join(", ")}`
    );
  }

  if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
    throw new Error("'comment' is required and must be a non-empty string");
  }

  if (comment.trim().length > 5000) {
    throw new Error("'comment' must be under 5000 characters");
  }

  if (rating !== undefined && rating !== null) {
    if (typeof rating !== "number" || !Number.isFinite(rating)) {
      throw new Error("'rating' must be a number");
    }
    if (rating < 1 || rating > 5) {
      throw new Error("'rating' must be between 1 and 5");
    }
    if (!Number.isInteger(rating)) {
      throw new Error("'rating' must be an integer");
    }
  }

  if (email !== undefined && email !== null && email !== "") {
    if (typeof email !== "string") {
      throw new Error("'email' must be a string");
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("'email' must be a valid email address");
    }
  }

  if (pageUrl !== undefined && pageUrl !== null) {
    if (typeof pageUrl !== "string" || pageUrl.length > 500) {
      throw new Error("'pageUrl' must be a string under 500 characters");
    }
  }

  return {
    category: category as FeedbackCategory,
    rating: typeof rating === "number" ? rating : undefined,
    comment: comment.trim(),
    email: email || undefined,
    pageUrl: pageUrl || undefined,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── POST Handler ────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Parse request
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON in request body", 400);
  }

  // Validate
  let feedbackRequest: FeedbackRequest;
  try {
    feedbackRequest = validateRequest(body);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Invalid request",
      400
    );
  }

  try {
    const userAgent = request.headers.get("user-agent");

    const record = await insertFeedback(
      {
        category: feedbackRequest.category as FeedbackCategory,
        rating: feedbackRequest.rating ?? null,
        comment: feedbackRequest.comment,
        email: feedbackRequest.email ?? null,
        pageUrl: feedbackRequest.pageUrl ?? null,
      },
      userAgent
    );

    return NextResponse.json(
      { success: true, id: record.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Feedback API error:", err);

    // Database connection issues
    if (
      err instanceof Error &&
      (err.message.includes("DATABASE_URL") ||
        err.message.includes("connect") ||
        err.message.includes("ECONNREFUSED"))
    ) {
      return errorResponse(
        "Database is not available. Feedback cannot be submitted at this time.",
        503
      );
    }

    return errorResponse("Failed to save feedback. Please try again.", 500);
  }
}

// ── GET Handler ─────────────────────────────────────────────────────────────────

/**
 * GET /api/feedback — list submitted feedback
 * GET /api/feedback?category=bug — filter by category
 * GET /api/feedback?summary=true — get aggregated statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Summary mode: return aggregated stats
    if (searchParams.get("summary") === "true") {
      const summary = await getFeedbackSummary();
      return NextResponse.json({ summary });
    }

    // List mode: return feedback entries
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Validate category filter
    if (category && !FEEDBACK_CATEGORIES.includes(category as FeedbackCategory)) {
      return errorResponse(
        `'category' must be one of: ${FEEDBACK_CATEGORIES.join(", ")}`,
        400
      );
    }

    const feedback = await getFeedback(
      category as FeedbackCategory | undefined,
      Math.min(limit, 500)
    );

    return NextResponse.json({ feedback, total: feedback.length });
  } catch (err) {
    console.error("Feedback GET error:", err);

    if (
      err instanceof Error &&
      (err.message.includes("DATABASE_URL") ||
        err.message.includes("connect") ||
        err.message.includes("ECONNREFUSED"))
    ) {
      return errorResponse(
        "Database is not available. Feedback cannot be retrieved at this time.",
        503
      );
    }

    return errorResponse("Failed to retrieve feedback.", 500);
  }
}
