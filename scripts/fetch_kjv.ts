/**
 * KJV Text Fetch & Parse Script
 *
 * Downloads the King James Bible from a reliable public domain JSON source,
 * validates the data against canonical book/chapter/verse counts, and saves
 * structured JSON to data/kjv.json.
 *
 * Usage: npx tsx scripts/fetch_kjv.ts
 *
 * Sources tried in order:
 *   1. midvash/bible-data (GitHub raw) — primary (structured books→chapters→verses)
 *   2. thiagobodruk/bible (GitHub raw) — fallback (abbrev→chapters array)
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// ── Canonical KJV Book Metadata ────────────────────────────────────────────
// 66 books, 1,189 chapters, 31,102 verses

const CANON: Record<string, number> = {
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
  Joshua: 24, Judges: 21, Ruth: 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
  Ezra: 10, Nehemiah: 13, Esther: 10, Job: 42, Psalms: 150,
  Proverbs: 31, Ecclesiastes: 12, "Song of Solomon": 8, Isaiah: 66,
  Jeremiah: 52, Lamentations: 5, Ezekiel: 48, Daniel: 12, Hosea: 14,
  Joel: 3, Amos: 9, Obadiah: 1, Jonah: 4, Micah: 7, Nahum: 3,
  Habakkuk: 3, Zephaniah: 3, Haggai: 2, Zechariah: 14, Malachi: 4,
  Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28,
  Romans: 16, "1 Corinthians": 16, "2 Corinthians": 13, Galatians: 6,
  Ephesians: 6, Philippians: 4, Colossians: 4, "1 Thessalonians": 5,
  "2 Thessalonians": 3, "1 Timothy": 6, "2 Timothy": 4, Titus: 3,
  Philemon: 1, Hebrews: 13, James: 5, "1 Peter": 5, "2 Peter": 3,
  "1 John": 5, "2 John": 1, "3 John": 1, Jude: 1, Revelation: 22,
};

const BOOK_ORDER = Object.keys(CANON);
const TOTAL_CHAPTERS = Object.values(CANON).reduce((a, b) => a + b, 0);
const TOTAL_VERSES = 31102;

// Book abbreviation mapping for thiagobodruk source (fallback).
const ABBREV_MAP: Record<string, string> = {
  gn: "Genesis", ex: "Exodus", lv: "Leviticus", nm: "Numbers", dt: "Deuteronomy",
  js: "Joshua", jg: "Judges", ru: "Ruth", "1sm": "1 Samuel", "2sm": "2 Samuel",
  "1kgs": "1 Kings", "2kgs": "2 Kings", "1ch": "1 Chronicles", "2ch": "2 Chronicles",
  ez: "Ezra", ne: "Nehemiah", et: "Esther", jb: "Job", ps: "Psalms",
  pr: "Proverbs", ec: "Ecclesiastes", so: "Song of Solomon", is: "Isaiah",
  jr: "Jeremiah", lm: "Lamentations", ek: "Ezekiel", dn: "Daniel",
  ho: "Hosea", jl: "Joel", am: "Amos", ob: "Obadiah", jh: "Jonah",
  mc: "Micah", na: "Nahum", hk: "Habakkuk", zp: "Zephaniah", hg: "Haggai",
  zc: "Zechariah", ma: "Malachi", mt: "Matthew", mk: "Mark", lk: "Luke",
  jn: "John", ac: "Acts", rm: "Romans", "1co": "1 Corinthians", "2co": "2 Corinthians",
  gl: "Galatians", ep: "Ephesians", ph: "Philippians", cl: "Colossians",
  "1th": "1 Thessalonians", "2th": "2 Thessalonians", "1tm": "1 Timothy",
  "2tm": "2 Timothy", tt: "Titus", pm: "Philemon", hb: "Hebrews",
  jm: "James", "1pe": "1 Peter", "2pe": "2 Peter", "1jn": "1 John",
  "2jn": "2 John", "3jn": "3 John", jd: "Jude", re: "Revelation",
};

interface RawVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface KJVData {
  meta: {
    source: string;
    fetchedAt: string;
    totalBooks: number;
    totalChapters: number;
    totalVerses: number;
  };
  verses: RawVerse[];
}

// ── Source Definitions ─────────────────────────────────────────────────────

interface MidvashBook {
  englishName: string;
  chapters: Array<{
    chapter: number;
    verses: Array<{ number: number; text: string }>;
  }>;
}

interface ThiagoBook {
  abbrev: string;
  chapters: string[][];
}

const SOURCES = [
  {
    name: "midvash/bible-data",
    url: "https://raw.githubusercontent.com/midvash/bible-data/main/versions/en/kjv/kjv.json",
    parser: "midvash" as const,
  },
  {
    name: "thiagobodruk/bible",
    url: "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json",
    parser: "thiago" as const,
  },
];

// ── Parsers ────────────────────────────────────────────────────────────────

function parseMidvash(data: { books: MidvashBook[] }): RawVerse[] {
  const verses: RawVerse[] = [];
  for (const book of data.books) {
    if (!CANON[book.englishName]) continue;
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        const text = verse.text.trim();
        if (!text) continue;
        verses.push({
          book: book.englishName,
          chapter: chapter.chapter,
          verse: verse.number,
          text,
        });
      }
    }
  }
  return verses;
}

function parseThiago(data: ThiagoBook[]): RawVerse[] {
  const verses: RawVerse[] = [];
  for (const book of data) {
    const bookName = ABBREV_MAP[book.abbrev];
    if (!bookName || !CANON[bookName]) continue;
    for (let ci = 0; ci < book.chapters.length; ci++) {
      const chapterNum = ci + 1;
      if (chapterNum > CANON[bookName]) continue;
      for (let vi = 0; vi < book.chapters[ci].length; vi++) {
        const text = book.chapters[ci][vi].trim();
        if (!text) continue;
        verses.push({ book: bookName, chapter: chapterNum, verse: vi + 1, text });
      }
    }
  }
  return verses;
}

// ── Fetch ──────────────────────────────────────────────────────────────────

async function fetchKJV(): Promise<RawVerse[]> {
  for (const source of SOURCES) {
    try {
      console.log(`Fetching KJV from: ${source.name}`);
      console.log(`  ${source.url}`);
      const res = await fetch(source.url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        console.warn(`  → HTTP ${res.status}, trying next source...`);
        continue;
      }

      const data = await res.json();
      const verses =
        source.parser === "midvash"
          ? parseMidvash(data as { books: MidvashBook[] })
          : parseThiago(data as ThiagoBook[]);

      if (verses.length >= 30000) {
        console.log(`  → Parsed ${verses.length} verses`);
        return verses;
      }

      console.warn(`  → Only got ${verses.length} verses, trying next source...`);
    } catch (err) {
      console.warn(`  → Error: ${err instanceof Error ? err.message : err}`);
    }
  }

  throw new Error(
    "Failed to fetch KJV from all sources. Check network and try again."
  );
}

// ── Validation ─────────────────────────────────────────────────────────────

function validate(verses: RawVerse[]): { ok: boolean; report: string } {
  const lines: string[] = [];
  let ok = true;

  // Count books
  const books = new Set(verses.map((v) => v.book));
  const bookCount = books.size;

  lines.push(`Books: ${bookCount}/66`);

  const missingBooks = BOOK_ORDER.filter((b) => !books.has(b));
  if (missingBooks.length > 0) {
    ok = false;
    lines.push(`  MISSING: ${missingBooks.join(", ")}`);
  }

  const extraBooks = [...books].filter((b) => !CANON[b]);
  if (extraBooks.length > 0) {
    lines.push(`  Extra (non-canonical): ${extraBooks.join(", ")}`);
  }

  // Count chapters per book
  let totalChapters = 0;
  const chapterIssues: string[] = [];
  for (const book of BOOK_ORDER) {
    const bookVerses = verses.filter((v) => v.book === book);
    const chapters = new Set(bookVerses.map((v) => v.chapter));
    const expectedChapters = CANON[book];
    totalChapters += chapters.size;

    if (chapters.size !== expectedChapters) {
      ok = false;
      chapterIssues.push(
        `  ${book}: ${chapters.size}/${expectedChapters} chapters`
      );
    }
  }

  lines.push(`Chapters: ${totalChapters}/${TOTAL_CHAPTERS}`);
  if (chapterIssues.length > 0) {
    lines.push(...chapterIssues.slice(0, 10));
    if (chapterIssues.length > 10) {
      lines.push(`  ... and ${chapterIssues.length - 10} more`);
    }
  }

  // Total verses
  lines.push(`Verses: ${verses.length}/${TOTAL_VERSES}`);

  // Check for duplicates
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const v of verses) {
    const key = `${v.book}|${v.chapter}|${v.verse}`;
    if (seen.has(key)) {
      dupes.push(key);
    }
    seen.add(key);
  }
  if (dupes.length > 0) {
    ok = false;
    lines.push(`Duplicate verses: ${dupes.length}`);
  }

  return { ok, report: lines.join("\n") };
}

// ── Sort & Dedupe ──────────────────────────────────────────────────────────

function sortAndDedupe(verses: RawVerse[]): RawVerse[] {
  // Deduplicate by (book, chapter, verse)
  const seen = new Set<string>();
  const unique: RawVerse[] = [];

  for (const v of verses) {
    const key = `${v.book}|${v.chapter}|${v.verse}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(v);
    }
  }

  // Sort by canonical book order, then chapter, then verse
  unique.sort((a, b) => {
    const bookA = BOOK_ORDER.indexOf(a.book);
    const bookB = BOOK_ORDER.indexOf(b.book);
    if (bookA !== bookB) return bookA - bookB;
    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
    return a.verse - b.verse;
  });

  return unique;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Xjoy — KJV Text Ingestion Pipeline    ║");
  console.log("╚══════════════════════════════════════════╝\n");

  // Fetch
  const raw = await fetchKJV();
  console.log(`\nFetched ${raw.length} raw verses.\n`);

  // Sort & dedupe
  const verses = sortAndDedupe(raw);
  console.log(`After sort & dedupe: ${verses.length} verses.\n`);

  // Validate
  const { ok, report } = validate(verses);
  console.log("── Validation ──");
  console.log(report);
  console.log();

  if (!ok) {
    console.error(
      "⚠ Validation found issues. Review the report above."
    );
    process.exit(1);
  }

  // Build output
  const output: KJVData = {
    meta: {
      source: "public domain KJV text (midvash/bible-data)",
      fetchedAt: new Date().toISOString(),
      totalBooks: new Set(verses.map((v) => v.book)).size,
      totalChapters: new Set(
        verses.map((v) => `${v.book}|${v.chapter}`)
      ).size,
      totalVerses: verses.length,
    },
    verses,
  };

  // Write
  const dataDir = join(__dirname, "..", "data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const outPath = join(dataDir, "kjv.json");
  writeFileSync(outPath, JSON.stringify(output));
  console.log(`✓ Written ${verses.length} verses to ${outPath}`);
  console.log(`  File size: ${(JSON.stringify(output).length / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
