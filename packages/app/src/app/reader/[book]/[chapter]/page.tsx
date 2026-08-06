import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getChapter,
  getBooks,
  getAdjacentChapters,
  isValidReference,
} from "@xjoy/shared";
import { ChapterReader } from "@/components/ChapterReader";
import { ReadingProgressTracker } from "@/components/ReadingProgressTracker";

interface PageParams {
  book: string;
  chapter: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { book, chapter: chapterStr } = await params;
  const bookName = decodeURIComponent(book);
  const chapterNum = parseInt(chapterStr, 10);

  if (!isValidReference(bookName, chapterNum)) {
    return { title: "未找到 — Xjoy" };
  }

  return {
    title: `${bookName} ${chapterNum} — Xjoy`,
    description: `阅读 ${bookName} 第 ${chapterNum} 章 — KJV 圣经。`,
  };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { book, chapter: chapterStr } = await params;
  const bookName = decodeURIComponent(book);
  const chapterNum = parseInt(chapterStr, 10);

  // Validate reference
  if (!isValidReference(bookName, chapterNum) || isNaN(chapterNum)) {
    notFound();
  }

  const verses = getChapter(bookName, chapterNum);

  if (verses.length === 0) {
    notFound();
  }

  const books = getBooks();
  const adjacent = getAdjacentChapters(bookName, chapterNum);

  return (
    <div className="min-h-[80vh]">
      <ReadingProgressTracker book={bookName} chapter={chapterNum} />
      <ChapterReader
        book={bookName}
        chapter={chapterNum}
        verses={verses}
        books={books}
        adjacent={adjacent}
      />
    </div>
  );
}
