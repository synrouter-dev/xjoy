import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <div className="max-w-xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 text-neutral-900 dark:text-neutral-100">
          Xjoy
        </h1>
        <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 mb-2 leading-relaxed">
          An AI-powered interface to the King James Bible.
        </p>
        <p className="text-base text-neutral-500 dark:text-neutral-500 mb-10 leading-relaxed">
          Ask questions, search scripture, and explore the Word — with
          faithful, context-aware responses grounded in the KJV text.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-8 py-3 text-base font-medium hover:opacity-90 transition-opacity"
          >
            Ask a Question
          </Link>
          <Link
            href="/reader"
            className="inline-flex items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 px-8 py-3 text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            Read Scripture
          </Link>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-xl">
        {[
          {
            title: "Ask",
            desc: "Ask theological and historical questions about scripture.",
          },
          {
            title: "Read",
            desc: "Browse the full KJV text by book, chapter, and verse.",
          },
          {
            title: "Search",
            desc: "Search the Bible by keyword, phrase, or topic.",
          },
        ].map(({ title, desc }) => (
          <div
            key={title}
            className="text-left p-4 rounded-lg border border-neutral-200 dark:border-neutral-800"
          >
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              {title}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
