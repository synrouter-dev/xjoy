import { ScreenHeader } from "@/components/ScreenHeader";
import { PlaceholderCard } from "@/components/PlaceholderCard";

export default function ReaderPage() {
  return (
    <div>
      <ScreenHeader
        title="Reader"
        description="Read the King James Bible — book by book, chapter by chapter."
      />

      <div className="space-y-4">
        <PlaceholderCard
          title="Coming Soon"
          body="The KJV text reader is being prepared. You will be able to browse all 66 books, navigate by chapter and verse, and bookmark passages for later reflection."
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            "Genesis",
            "Psalms",
            "Isaiah",
            "Matthew",
            "John",
            "Romans",
            "Acts",
            "Revelation",
          ].map((book) => (
            <div
              key={book}
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-800 text-center text-sm text-neutral-500 dark:text-neutral-500"
            >
              {book}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
