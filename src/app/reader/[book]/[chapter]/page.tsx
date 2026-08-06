import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getChapter,
  getBooks,
  getAdjacentChapters,
  isValidReference,
} from "@/lib/bible";
import { ChapterReader } from "@/components/ChapterReader";

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
    return { title: "Not Found — Xjoy" };
  }

  return {
    title: `${bookName} ${chapterNum} — Xjoy`,
    description: `Read ${bookName} chapter ${chapterNum} from the King James Bible.`,
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
