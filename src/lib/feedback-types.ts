/**
 * Shared feedback types and constants.
 *
 * Separated from feedback-db.ts so client components can use these
 * without pulling in the `pg` dependency.
 */

export type FeedbackCategory =
  | "ai_accuracy"
  | "reading_experience"
  | "overall_impression"
  | "feature_request"
  | "bug";

export const FEEDBACK_CATEGORIES: readonly FeedbackCategory[] = [
  "ai_accuracy",
  "reading_experience",
  "overall_impression",
  "feature_request",
  "bug",
] as const;

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  ai_accuracy: "AI 对话准确性",
  reading_experience: "阅读体验",
  overall_impression: "整体印象",
  feature_request: "功能建议",
  bug: "Bug 报告",
};

export interface FeedbackSubmission {
  category: FeedbackCategory;
  rating?: number | null;
  comment: string;
  email?: string | null;
  pageUrl?: string | null;
}

export interface FeedbackRecord extends FeedbackSubmission {
  id: number;
  userAgent: string | null;
  createdAt: string;
}
