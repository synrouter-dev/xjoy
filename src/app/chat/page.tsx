import { ScreenHeader } from "@/components/ScreenHeader";
import { PlaceholderCard } from "@/components/PlaceholderCard";

export default function ChatPage() {
  return (
    <div>
      <ScreenHeader
        title="Chat"
        description="Ask questions about scripture. Grounded in the KJV text, faithful in every response."
      />

      <PlaceholderCard
        title="Coming Soon"
        body="The AI chat interface is being built. You will be able to ask questions about passages, explore theological themes, and receive responses grounded directly in the KJV text — never fabricated, always sourced."
      />

      {/* Preview of the chat interface */}
      <div className="mt-8 space-y-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-100 dark:bg-neutral-900 rounded w-3/4" />
            <div className="h-4 bg-neutral-100 dark:bg-neutral-900 rounded w-1/2" />
            <div className="h-4 bg-neutral-100 dark:bg-neutral-900 rounded w-2/3" />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <div className="flex-1 max-w-[80%] space-y-2">
            <div className="h-4 bg-accent/20 rounded w-full" />
            <div className="h-4 bg-accent/20 rounded w-3/4" />
          </div>
          <div className="w-8 h-8 rounded-full bg-accent/30 flex-shrink-0" />
        </div>
      </div>

      {/* Sample questions */}
      <div className="mt-8">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-500 mb-3">
          Example questions you&apos;ll be able to ask:
        </p>
        <div className="space-y-2">
          {[
            "What does Jesus teach about forgiveness in the Gospels?",
            "Explain the context of Psalm 23.",
            "How does Paul describe faith in Romans?",
            "Compare the creation accounts in Genesis 1 and 2.",
          ].map((q) => (
            <div
              key={q}
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-400"
            >
              {q}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
