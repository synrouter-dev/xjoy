/**
 * Bible Data Access Layer
 *
 * Loads the KJV JSON (31,102 verses) and provides lookup functions.
 * The JSON is loaded at module level — cached in memory across requests
 * in production. For a team-of-one prototype, this is the boring, correct choice.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BookMeta {
  name: string;
  chapters: number;
  testament: "old" | "new";
  section: string;
}

interface KJVData {
  meta: {
    source: string;
    fetchedAt: string;
    totalBooks: number;
    totalChapters: number;
    totalVerses: number;
  };
  verses: Verse[];
}

// ── Book Organization ────────────────────────────────────────────────────────

/**
 * Canonical book order with chapter counts and organizational metadata.
 * Used for rendering the book selector with section groupings.
 */
const BOOKS: BookMeta[] = [
  // ── Old Testament ──
  // Law (Pentateuch)
  { name: "Genesis", chapters: 50, testament: "old", section: "The Law" },
  { name: "Exodus", chapters: 40, testament: "old", section: "The Law" },
  { name: "Leviticus", chapters: 27, testament: "old", section: "The Law" },
  { name: "Numbers", chapters: 36, testament: "old", section: "The Law" },
  { name: "Deuteronomy", chapters: 34, testament: "old", section: "The Law" },
  // History
  { name: "Joshua", chapters: 24, testament: "old", section: "History" },
  { name: "Judges", chapters: 21, testament: "old", section: "History" },
  { name: "Ruth", chapters: 4, testament: "old", section: "History" },
  { name: "1 Samuel", chapters: 31, testament: "old", section: "History" },
  { name: "2 Samuel", chapters: 24, testament: "old", section: "History" },
  { name: "1 Kings", chapters: 22, testament: "old", section: "History" },
  { name: "2 Kings", chapters: 25, testament: "old", section: "History" },
  { name: "1 Chronicles", chapters: 29, testament: "old", section: "History" },
  { name: "2 Chronicles", chapters: 36, testament: "old", section: "History" },
  { name: "Ezra", chapters: 10, testament: "old", section: "History" },
  { name: "Nehemiah", chapters: 13, testament: "old", section: "History" },
  { name: "Esther", chapters: 10, testament: "old", section: "History" },
  // Poetry & Wisdom
  { name: "Job", chapters: 42, testament: "old", section: "Poetry" },
  { name: "Psalms", chapters: 150, testament: "old", section: "Poetry" },
  { name: "Proverbs", chapters: 31, testament: "old", section: "Poetry" },
  { name: "Ecclesiastes", chapters: 12, testament: "old", section: "Poetry" },
  { name: "Song of Solomon", chapters: 8, testament: "old", section: "Poetry" },
  // Major Prophets
  { name: "Isaiah", chapters: 66, testament: "old", section: "Major Prophets" },
  { name: "Jeremiah", chapters: 52, testament: "old", section: "Major Prophets" },
  { name: "Lamentations", chapters: 5, testament: "old", section: "Major Prophets" },
  { name: "Ezekiel", chapters: 48, testament: "old", section: "Major Prophets" },
  { name: "Daniel", chapters: 12, testament: "old", section: "Major Prophets" },
  // Minor Prophets
  { name: "Hosea", chapters: 14, testament: "old", section: "Minor Prophets" },
  { name: "Joel", chapters: 3, testament: "old", section: "Minor Prophets" },
  { name: "Amos", chapters: 9, testament: "old", section: "Minor Prophets" },
  { name: "Obadiah", chapters: 1, testament: "old", section: "Minor Prophets" },
  { name: "Jonah", chapters: 4, testament: "old", section: "Minor Prophets" },
  { name: "Micah", chapters: 7, testament: "old", section: "Minor Prophets" },
  { name: "Nahum", chapters: 3, testament: "old", section: "Minor Prophets" },
  { name: "Habakkuk", chapters: 3, testament: "old", section: "Minor Prophets" },
  { name: "Zephaniah", chapters: 3, testament: "old", section: "Minor Prophets" },
  { name: "Haggai", chapters: 2, testament: "old", section: "Minor Prophets" },
  { name: "Zechariah", chapters: 14, testament: "old", section: "Minor Prophets" },
  { name: "Malachi", chapters: 4, testament: "old", section: "Minor Prophets" },

  // ── New Testament ──
  // Gospels
  { name: "Matthew", chapters: 28, testament: "new", section: "Gospels" },
  { name: "Mark", chapters: 16, testament: "new", section: "Gospels" },
  { name: "Luke", chapters: 24, testament: "new", section: "Gospels" },
  { name: "John", chapters: 21, testament: "new", section: "Gospels" },
  // History
  { name: "Acts", chapters: 28, testament: "new", section: "History" },
  // Pauline Epistles
  { name: "Romans", chapters: 16, testament: "new", section: "Pauline Epistles" },
  { name: "1 Corinthians", chapters: 16, testament: "new", section: "Pauline Epistles" },
  { name: "2 Corinthians", chapters: 13, testament: "new", section: "Pauline Epistles" },
  { name: "Galatians", chapters: 6, testament: "new", section: "Pauline Epistles" },
  { name: "Ephesians", chapters: 6, testament: "new", section: "Pauline Epistles" },
  { name: "Philippians", chapters: 4, testament: "new", section: "Pauline Epistles" },
  { name: "Colossians", chapters: 4, testament: "new", section: "Pauline Epistles" },
  { name: "1 Thessalonians", chapters: 5, testament: "new", section: "Pauline Epistles" },
  { name: "2 Thessalonians", chapters: 3, testament: "new", section: "Pauline Epistles" },
  { name: "1 Timothy", chapters: 6, testament: "new", section: "Pauline Epistles" },
  { name: "2 Timothy", chapters: 4, testament: "new", section: "Pauline Epistles" },
  { name: "Titus", chapters: 3, testament: "new", section: "Pauline Epistles" },
  { name: "Philemon", chapters: 1, testament: "new", section: "Pauline Epistles" },
  // General Epistles
  { name: "Hebrews", chapters: 13, testament: "new", section: "General Epistles" },
  { name: "James", chapters: 5, testament: "new", section: "General Epistles" },
  { name: "1 Peter", chapters: 5, testament: "new", section: "General Epistles" },
  { name: "2 Peter", chapters: 3, testament: "new", section: "General Epistles" },
  { name: "1 John", chapters: 5, testament: "new", section: "General Epistles" },
  { name: "2 John", chapters: 1, testament: "new", section: "General Epistles" },
  { name: "3 John", chapters: 1, testament: "new", section: "General Epistles" },
  { name: "Jude", chapters: 1, testament: "new", section: "General Epistles" },
  // Apocalypse
  { name: "Revelation", chapters: 22, testament: "new", section: "Apocalypse" },
];

const BOOK_ORDER = BOOKS.map((b) => b.name);
const BOOK_MAP = new Map(BOOKS.map((b) => [b.name, b]));

// ── Abbreviation / Alternate Name Mappings ──────────────────────────────────────

/**
 * Maps common abbreviations and alternate names to canonical book names.
 * All keys are lowercase. Every entry resolves to a name in BOOK_MAP.
 *
 * Sources: SBL abbreviations, common usage, OSIS, and user-friendly shorthand.
 * Covers all 66 books of the KJV canon.
 */
const BOOK_ABBREVIATIONS: Record<string, string> = {
  // ── Old Testament ──

  // Law (Pentateuch)
  gen: "Genesis",
  ge: "Genesis",
  gn: "Genesis",
  exo: "Exodus",
  ex: "Exodus",
  exod: "Exodus",
  lev: "Leviticus",
  le: "Leviticus",
  lv: "Leviticus",
  num: "Numbers",
  nu: "Numbers",
  nm: "Numbers",
  nb: "Numbers",
  deut: "Deuteronomy",
  deu: "Deuteronomy",
  dt: "Deuteronomy",

  // History
  josh: "Joshua",
  jos: "Joshua",
  judg: "Judges",
  jdg: "Judges",
  jg: "Judges",
  rth: "Ruth",
  ru: "Ruth",
  "1sam": "1 Samuel",
  "1 sa": "1 Samuel",
  "1sm": "1 Samuel",
  "1 s": "1 Samuel",
  "i sam": "1 Samuel",
  "2sam": "2 Samuel",
  "2 sa": "2 Samuel",
  "2sm": "2 Samuel",
  "2 s": "2 Samuel",
  "ii sam": "2 Samuel",
  "1kgs": "1 Kings",
  "1 ki": "1 Kings",
  "1k": "1 Kings",
  "i kgs": "1 Kings",
  "2kgs": "2 Kings",
  "2 ki": "2 Kings",
  "2k": "2 Kings",
  "ii kgs": "2 Kings",
  "1chr": "1 Chronicles",
  "1 ch": "1 Chronicles",
  "1ch": "1 Chronicles",
  "i chr": "1 Chronicles",
  "2chr": "2 Chronicles",
  "2 ch": "2 Chronicles",
  "2ch": "2 Chronicles",
  "ii chr": "2 Chronicles",
  ezr: "Ezra",
  neh: "Nehemiah",
  ne: "Nehemiah",
  est: "Esther",
  es: "Esther",

  // Poetry & Wisdom
  jb: "Job",
  ps: "Psalms",
  psa: "Psalms",
  pss: "Psalms",
  psalm: "Psalms",
  prov: "Proverbs",
  pro: "Proverbs",
  pr: "Proverbs",
  prv: "Proverbs",
  eccl: "Ecclesiastes",
  ecc: "Ecclesiastes",
  ec: "Ecclesiastes",
  qoheleth: "Ecclesiastes",
  song: "Song of Solomon",
  "song of songs": "Song of Solomon",
  sos: "Song of Solomon",
  canticles: "Song of Solomon",
  ss: "Song of Solomon",
  cant: "Song of Solomon",

  // Major Prophets
  isa: "Isaiah",
  is: "Isaiah",
  jer: "Jeremiah",
  je: "Jeremiah",
  jr: "Jeremiah",
  lam: "Lamentations",
  la: "Lamentations",
  lm: "Lamentations",
  ezek: "Ezekiel",
  eze: "Ezekiel",
  ez: "Ezekiel",
  dan: "Daniel",
  da: "Daniel",
  dn: "Daniel",

  // Minor Prophets
  hos: "Hosea",
  ho: "Hosea",
  joe: "Joel",
  jl: "Joel",
  amo: "Amos",
  am: "Amos",
  obad: "Obadiah",
  ob: "Obadiah",
  oba: "Obadiah",
  jon: "Jonah",
  jnh: "Jonah",
  mic: "Micah",
  mc: "Micah",
  nah: "Nahum",
  na: "Nahum",
  hab: "Habakkuk",
  hb: "Habakkuk",
  zeph: "Zephaniah",
  zep: "Zephaniah",
  zp: "Zephaniah",
  hag: "Haggai",
  hg: "Haggai",
  zech: "Zechariah",
  zec: "Zechariah",
  zc: "Zechariah",
  mal: "Malachi",
  ml: "Malachi",

  // ── New Testament ──

  // Gospels
  matt: "Matthew",
  mat: "Matthew",
  mt: "Matthew",
  mar: "Mark",
  mk: "Mark",
  mrk: "Mark",
  luk: "Luke",
  lk: "Luke",
  lu: "Luke",
  jn: "John",
  joh: "John",
  jhn: "John",

  // History
  act: "Acts",
  ac: "Acts",

  // Pauline Epistles
  rom: "Romans",
  ro: "Romans",
  rm: "Romans",
  "1cor": "1 Corinthians",
  "1 cor": "1 Corinthians",
  "1 co": "1 Corinthians",
  "1cr": "1 Corinthians",
  "1 c": "1 Corinthians",
  "i cor": "1 Corinthians",
  "2cor": "2 Corinthians",
  "2 cor": "2 Corinthians",
  "2 co": "2 Corinthians",
  "2cr": "2 Corinthians",
  "2 c": "2 Corinthians",
  "ii cor": "2 Corinthians",
  gal: "Galatians",
  ga: "Galatians",
  gl: "Galatians",
  eph: "Ephesians",
  ep: "Ephesians",
  phil: "Philippians",
  php: "Philippians",
  phi: "Philippians",
  pp: "Philippians",
  col: "Colossians",
  co: "Colossians",
  "1thess": "1 Thessalonians",
  "1 thes": "1 Thessalonians",
  "1th": "1 Thessalonians",
  "1 th": "1 Thessalonians",
  "i thess": "1 Thessalonians",
  "2thess": "2 Thessalonians",
  "2 thes": "2 Thessalonians",
  "2th": "2 Thessalonians",
  "2 th": "2 Thessalonians",
  "ii thess": "2 Thessalonians",
  "1tim": "1 Timothy",
  "1 ti": "1 Timothy",
  "1tm": "1 Timothy",
  "i tim": "1 Timothy",
  "2tim": "2 Timothy",
  "2 ti": "2 Timothy",
  "2tm": "2 Timothy",
  "ii tim": "2 Timothy",
  tit: "Titus",
  ti: "Titus",
  philem: "Philemon",
  phm: "Philemon",
  phile: "Philemon",
  pm: "Philemon",

  // General Epistles
  heb: "Hebrews",
  he: "Hebrews",
  jam: "James",
  jas: "James",
  jms: "James",
  ja: "James",
  "1pet": "1 Peter",
  "1 pe": "1 Peter",
  "1pt": "1 Peter",
  "1 p": "1 Peter",
  "i pet": "1 Peter",
  "2pet": "2 Peter",
  "2 pe": "2 Peter",
  "2pt": "2 Peter",
  "2 p": "2 Peter",
  "ii pet": "2 Peter",
  "1jn": "1 John",
  "1 jo": "1 John",
  "1j": "1 John",
  "1joh": "1 John",
  "i jn": "1 John",
  "2jn": "2 John",
  "2 jo": "2 John",
  "2j": "2 John",
  "2joh": "2 John",
  "ii jn": "2 John",
  "3jn": "3 John",
  "3 jo": "3 John",
  "3j": "3 John",
  "3joh": "3 John",
  "iii jn": "3 John",
  jud: "Jude",

  // Apocalypse
  rev: "Revelation",
  re: "Revelation",
  rv: "Revelation",
  apocalypse: "Revelation",
  apoc: "Revelation",
};

/** Canonical names → lowercase for direct lookup. */
const CANONICAL_LOWER = new Map<string, string>();
for (const b of BOOKS) {
  CANONICAL_LOWER.set(b.name.toLowerCase(), b.name);
}

/**
 * Resolve a book name string (case-insensitive) to its canonical KJV name.
 *
 * Tries (in order):
 *   1. Exact match against canonical names (e.g. "john" → "John")
 *   2. Abbreviation / alternate name lookup (exact key)
 *   3. Collapsed-whitespace lookup (e.g. "1  cor" → "1 cor" → match)
 *   4. Whitespace-stripped lookup (e.g. "1 Cor" → "1cor" → match)
 *
 * Returns the canonical name, or undefined if unrecognized.
 */
export function resolveBookName(input: string): string | undefined {
  const key = input.toLowerCase().trim();
  if (!key) return undefined;

  // 1. Direct canonical match
  const canonical = CANONICAL_LOWER.get(key);
  if (canonical) return canonical;

  // 2. Abbreviation lookup (exact key)
  const abbr = BOOK_ABBREVIATIONS[key];
  if (abbr) return abbr;

  // 3. Collapse whitespace (normalize "1  cor" → "1 cor")
  const collapsed = key.replace(/\s+/g, " ");
  if (collapsed !== key) {
    const abbr2 = BOOK_ABBREVIATIONS[collapsed];
    if (abbr2) return abbr2;

    // Also check canonical with collapsed whitespace
    const canon2 = CANONICAL_LOWER.get(collapsed);
    if (canon2) return canon2;
  }

  // 4. Strip all whitespace ("1 Cor" → "1cor")
  const noSpaces = key.replace(/\s+/g, "");
  if (noSpaces !== collapsed) {
    const abbr3 = BOOK_ABBREVIATIONS[noSpaces];
    if (abbr3) return abbr3;
  }

  return undefined;
}

// ── Data Loading ─────────────────────────────────────────────────────────────

let _verses: Verse[] | null = null;
let _versesByBookChapter: Map<string, Verse[]> | null = null;

function loadData(): Verse[] {
  if (_verses) return _verses;

  // Try multiple paths for monorepo: from app/, from root, from shared/
  // Vercel deploys from root, so "data/kjv.json" should resolve.
  // In local dev from packages/app, the "../../data/kjv.json" path is needed.
  const candidates = [
    join(process.cwd(), "data", "kjv.json"),                  // root (Vercel, Fly.io)
    join(process.cwd(), "packages", "app", "data", "kjv.json"), // root → app copy (Vercel alternate)
    join(process.cwd(), "..", "..", "data", "kjv.json"),      // from packages/app (local dev)
  ];
  let dataPath = candidates.find((p) => existsSync(p)) ?? candidates[0];

  let raw: string;
  try {
    // turbopackIgnore: this data file is intentionally loaded at runtime;
    // static analysis of process.cwd() causes whole-project tracing which
    // exceeds Vercel deployment size limits.
    raw = readFileSync(/* turbopackIgnore: true */ dataPath, "utf-8");
  } catch (err) {
    console.error(
      `Failed to read KJV data at ${dataPath}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    _verses = [];
    _versesByBookChapter = new Map();
    return _verses;
  }

  let data: KJVData;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(
      `Failed to parse KJV data: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    _verses = [];
    _versesByBookChapter = new Map();
    return _verses;
  }

  _verses = data.verses;

  // Build index: "Book|Chapter" → Verse[]
  _versesByBookChapter = new Map();
  for (const v of data.verses) {
    const key = `${v.book}|${v.chapter}`;
    const arr = _versesByBookChapter.get(key);
    if (arr) {
      arr.push(v);
    } else {
      _versesByBookChapter.set(key, [v]);
    }
  }

  return _verses;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Get all 66 books with metadata, in canonical order. */
export function getBooks(): BookMeta[] {
  return BOOKS;
}

/** Get metadata for a single book. Returns undefined for invalid names. */
export function getBookMeta(name: string): BookMeta | undefined {
  return BOOK_MAP.get(name);
}

/**
 * Get all verses for a given book and chapter.
 * Returns an empty array if the reference is invalid.
 */
export function getChapter(book: string, chapter: number): Verse[] {
  loadData();
  if (!_versesByBookChapter) return [];
  return _versesByBookChapter.get(`${book}|${chapter}`) ?? [];
}

/**
 * Get a single verse by reference. Returns undefined if not found.
 */
export function getVerse(
  book: string,
  chapter: number,
  verse: number
): Verse | undefined {
  const verses = getChapter(book, chapter);
  return verses.find((v) => v.verse === verse);
}

/**
 * Get a range of verses within a single chapter.
 * Returns an empty array if no verses match the range.
 */
export function getVerseRange(
  book: string,
  chapter: number,
  startVerse: number,
  endVerse: number
): Verse[] {
  const verses = getChapter(book, chapter);
  return verses.filter((v) => v.verse >= startVerse && v.verse <= endVerse);
}

/**
 * Get the previous and next chapter references for navigation.
 */
export function getAdjacentChapters(
  book: string,
  chapter: number
): { prev: { book: string; chapter: number } | null; next: { book: string; chapter: number } | null } {
  const bookIdx = BOOK_ORDER.indexOf(book);
  if (bookIdx === -1) return { prev: null, next: null };

  const bookMeta = BOOK_MAP.get(book);
  if (!bookMeta) return { prev: null, next: null };

  let prev: { book: string; chapter: number } | null = null;
  let next: { book: string; chapter: number } | null = null;

  if (chapter > 1) {
    prev = { book, chapter: chapter - 1 };
  } else if (bookIdx > 0) {
    const prevBook = BOOKS[bookIdx - 1];
    prev = { book: prevBook.name, chapter: prevBook.chapters };
  }

  if (chapter < bookMeta.chapters) {
    next = { book, chapter: chapter + 1 };
  } else if (bookIdx < BOOKS.length - 1) {
    next = { book: BOOKS[bookIdx + 1].name, chapter: 1 };
  }

  return { prev, next };
}

/** Get the first canonical chapter reference. */
export function getFirstChapter(): { book: string; chapter: number } {
  return { book: "Genesis", chapter: 1 };
}

/** Check whether a book + chapter reference is valid. */
export function isValidReference(book: string, chapter: number): boolean {
  const meta = BOOK_MAP.get(book);
  if (!meta) return false;
  return chapter >= 1 && chapter <= meta.chapters;
}

/** Get total number of verses across the entire Bible. */
export function getTotalVerses(): number {
  loadData();
  return _verses?.length ?? 0;
}
