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

/**
 * 为静态导出生成所有书卷+章节路径。
 * 66 卷书 × 1,189 章 = 1,189 个页面。
 * 仅在 output: "export" 模式下有效。
 */
export async function generateStaticParams(): Promise<PageParams[]> {
  const books = getBooks();
  const paths: PageParams[] = [];

  for (const book of books) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      paths.push({
        book: encodeURIComponent(book.name),
        chapter: String(ch),
      });
    }
  }

  return paths;
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
