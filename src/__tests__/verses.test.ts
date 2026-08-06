/**
 * Verse lookup API tests.
 *
 * Tests the reference parser across all supported formats,
 * error cases, and edge cases — the parts that don't require
 * database access.
 */

import { describe, it, expect } from "@jest/globals";
import { resolveBookName, getBooks } from "@/lib/bible";

// ── Reference Parser (testable copy of API route logic) ────────────────────────

interface ParsedReference {
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
}

function parseReference(ref: string): ParsedReference {
  const trimmed = ref.trim();
  const match = trimmed.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);

  if (!match) {
    throw new Error(
      `Invalid reference format: "${trimmed}". ` +
        "Use 'Book chapter:verse' (e.g., 'John 3:16'), " +
        "'Book chapter:start-end' (e.g., 'John 3:16-17'), " +
        "or 'Book chapter' (e.g., 'Genesis 1')."
    );
  }

  const rawBook = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const startVerse = match[3] ? parseInt(match[3], 10) : undefined;
  const endVerse = match[4] ? parseInt(match[4], 10) : undefined;

  if (chapter < 1) {
    throw new Error(`Invalid chapter: ${chapter}. Chapter must be >= 1.`);
  }

  if (startVerse !== undefined && startVerse < 1) {
    throw new Error(`Invalid verse: ${startVerse}. Verse must be >= 1.`);
  }

  if (endVerse !== undefined) {
    if (startVerse === undefined) {
      throw new Error(
        "Invalid reference: end verse specified without start verse."
      );
    }
    if (endVerse < startVerse) {
      throw new Error(
        `Invalid verse range: end verse (${endVerse}) must be >= start verse (${startVerse}).`
      );
    }
  }

  const canonicalBook = resolveBookName(rawBook);

  if (!canonicalBook) {
    throw new Error(
      `Unknown book: "${rawBook}". ` +
        "Use the full book name (e.g., 'John', '1 Corinthians', 'Song of Solomon') " +
        "or a common abbreviation (e.g., 'Jn', '1 Cor', 'Song')."
    );
  }

  return { book: canonicalBook, chapter, startVerse, endVerse };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("parseReference", () => {
  // ── Single verse ──────────────────────────────────────────────────────────

  describe("single verse", () => {
    it("parses a simple reference", () => {
      const result = parseReference("John 3:16");
      expect(result).toEqual({
        book: "John",
        chapter: 3,
        startVerse: 16,
        endVerse: undefined,
      });
    });

    it("parses case-insensitively", () => {
      const result = parseReference("john 3:16");
      expect(result.book).toBe("John");
      expect(result.chapter).toBe(3);
      expect(result.startVerse).toBe(16);
    });

    it("parses Genesis 1:1 (first verse)", () => {
      const result = parseReference("Genesis 1:1");
      expect(result).toEqual({
        book: "Genesis",
        chapter: 1,
        startVerse: 1,
        endVerse: undefined,
      });
    });
  });

  // ── Verse range ────────────────────────────────────────────────────────────

  describe("verse range", () => {
    it("parses a verse range", () => {
      const result = parseReference("John 3:16-17");
      expect(result).toEqual({
        book: "John",
        chapter: 3,
        startVerse: 16,
        endVerse: 17,
      });
    });

    it("parses an entire chapter range", () => {
      const result = parseReference("Psalms 23:1-6");
      expect(result).toEqual({
        book: "Psalms",
        chapter: 23,
        startVerse: 1,
        endVerse: 6,
      });
    });
  });

  // ── Full chapter ───────────────────────────────────────────────────────────

  describe("full chapter", () => {
    it("parses a full chapter reference", () => {
      const result = parseReference("Genesis 1");
      expect(result).toEqual({
        book: "Genesis",
        chapter: 1,
        startVerse: undefined,
        endVerse: undefined,
      });
    });

    it("parses a full chapter with multi-digit chapter", () => {
      const result = parseReference("Psalms 119");
      expect(result).toEqual({
        book: "Psalms",
        chapter: 119,
        startVerse: undefined,
        endVerse: undefined,
      });
    });
  });

  // ── Numbered books ─────────────────────────────────────────────────────────

  describe("numbered books", () => {
    it("parses 1 Corinthians", () => {
      const result = parseReference("1 Corinthians 13:4");
      expect(result.book).toBe("1 Corinthians");
      expect(result.chapter).toBe(13);
      expect(result.startVerse).toBe(4);
    });

    it("parses 2 Kings", () => {
      const result = parseReference("2 Kings 2:11");
      expect(result.book).toBe("2 Kings");
      expect(result.chapter).toBe(2);
      expect(result.startVerse).toBe(11);
    });

    it("parses 1 John", () => {
      const result = parseReference("1 John 3:16");
      expect(result.book).toBe("1 John");
      expect(result.chapter).toBe(3);
      expect(result.startVerse).toBe(16);
    });

    it("parses 1 Samuel chapter", () => {
      const result = parseReference("1 Samuel 17");
      expect(result.book).toBe("1 Samuel");
      expect(result.chapter).toBe(17);
      expect(result.startVerse).toBeUndefined();
    });
  });

  // ── Multi-word book names ──────────────────────────────────────────────────

  describe("multi-word books", () => {
    it("parses Song of Solomon", () => {
      const result = parseReference("Song of Solomon 2:1");
      expect(result.book).toBe("Song of Solomon");
      expect(result.chapter).toBe(2);
      expect(result.startVerse).toBe(1);
    });
  });

  // ── Error cases ────────────────────────────────────────────────────────────

  describe("error handling", () => {
    it("rejects an unknown book name", () => {
      expect(() => parseReference("FakeBook 1:1")).toThrow("Unknown book");
    });

    it("rejects a completely invalid string", () => {
      expect(() => parseReference("not a reference")).toThrow(
        "Invalid reference format"
      );
    });

    it("rejects an empty string", () => {
      expect(() => parseReference("")).toThrow("Invalid reference format");
    });

    it("rejects reversed verse range", () => {
      expect(() => parseReference("John 3:17-16")).toThrow(
        "end verse"
      );
    });

    it("rejects chapter 0", () => {
      expect(() => parseReference("Genesis 0:1")).toThrow("chapter");
    });

    it("rejects verse 0", () => {
      expect(() => parseReference("Genesis 1:0")).toThrow("verse");
    });

    it("rejects negative chapter", () => {
      expect(() => parseReference("Genesis -1:1")).toThrow("Invalid reference format");
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("trims leading/trailing whitespace", () => {
      const result = parseReference("  John 3:16  ");
      expect(result.book).toBe("John");
    });

    it("handles extra internal whitespace", () => {
      // The regex should handle multiple spaces between book and chapter
      const result = parseReference("John  3:16");
      expect(result.book).toBe("John");
      expect(result.chapter).toBe(3);
      expect(result.startVerse).toBe(16);
    });

    it("parses the last book (Revelation)", () => {
      const result = parseReference("Revelation 22:21");
      expect(result).toEqual({
        book: "Revelation",
        chapter: 22,
        startVerse: 21,
        endVerse: undefined,
      });
    });

    it("preserves original case in canonical name", () => {
      const result = parseReference("PSALMS 23:1");
      expect(result.book).toBe("Psalms");
    });
  });
});

describe("resolveBookName (abbreviations)", () => {
  // ── Acceptance criteria ──
  it('resolves "Jn" → John', () => {
    expect(resolveBookName("Jn")).toBe("John");
    expect(resolveBookName("jn")).toBe("John");
    expect(resolveBookName("JN")).toBe("John");
  });

  it('resolves "1 Cor" → 1 Corinthians', () => {
    expect(resolveBookName("1 Cor")).toBe("1 Corinthians");
    expect(resolveBookName("1 cor")).toBe("1 Corinthians");
  });

  it('resolves "Song" → Song of Solomon', () => {
    expect(resolveBookName("Song")).toBe("Song of Solomon");
    expect(resolveBookName("song")).toBe("Song of Solomon");
  });

  it('resolves "SOS" → Song of Solomon', () => {
    expect(resolveBookName("SOS")).toBe("Song of Solomon");
    expect(resolveBookName("sos")).toBe("Song of Solomon");
  });

  it('resolves canonical names unchanged', () => {
    expect(resolveBookName("Genesis")).toBe("Genesis");
    expect(resolveBookName("John")).toBe("John");
    expect(resolveBookName("1 Corinthians")).toBe("1 Corinthians");
    expect(resolveBookName("Song of Solomon")).toBe("Song of Solomon");
  });

  // ── Old Testament abbreviations ──
  it("resolves Pentateuch abbreviations", () => {
    expect(resolveBookName("Gen")).toBe("Genesis");
    expect(resolveBookName("Exo")).toBe("Exodus");
    expect(resolveBookName("Ex")).toBe("Exodus");
    expect(resolveBookName("Lev")).toBe("Leviticus");
    expect(resolveBookName("Num")).toBe("Numbers");
    expect(resolveBookName("Deut")).toBe("Deuteronomy");
    expect(resolveBookName("Dt")).toBe("Deuteronomy");
  });

  it("resolves History book abbreviations", () => {
    expect(resolveBookName("Josh")).toBe("Joshua");
    expect(resolveBookName("Judg")).toBe("Judges");
    expect(resolveBookName("1Sam")).toBe("1 Samuel");
    expect(resolveBookName("2Sam")).toBe("2 Samuel");
    expect(resolveBookName("1Kgs")).toBe("1 Kings");
    expect(resolveBookName("2Kgs")).toBe("2 Kings");
    expect(resolveBookName("1Chr")).toBe("1 Chronicles");
    expect(resolveBookName("2Chr")).toBe("2 Chronicles");
    expect(resolveBookName("Neh")).toBe("Nehemiah");
    expect(resolveBookName("Est")).toBe("Esther");
  });

  it("resolves Poetry book abbreviations", () => {
    expect(resolveBookName("Ps")).toBe("Psalms");
    expect(resolveBookName("Psa")).toBe("Psalms");
    expect(resolveBookName("Psalm")).toBe("Psalms");
    expect(resolveBookName("Prov")).toBe("Proverbs");
    expect(resolveBookName("Eccl")).toBe("Ecclesiastes");
    expect(resolveBookName("Song")).toBe("Song of Solomon");
    expect(resolveBookName("Canticles")).toBe("Song of Solomon");
  });

  it("resolves Major Prophet abbreviations", () => {
    expect(resolveBookName("Isa")).toBe("Isaiah");
    expect(resolveBookName("Jer")).toBe("Jeremiah");
    expect(resolveBookName("Lam")).toBe("Lamentations");
    expect(resolveBookName("Ezek")).toBe("Ezekiel");
    expect(resolveBookName("Dan")).toBe("Daniel");
  });

  it("resolves Minor Prophet abbreviations", () => {
    expect(resolveBookName("Hos")).toBe("Hosea");
    expect(resolveBookName("Joel")).toBe("Joel");
    expect(resolveBookName("Amos")).toBe("Amos");
    expect(resolveBookName("Obad")).toBe("Obadiah");
    expect(resolveBookName("Jon")).toBe("Jonah");
    expect(resolveBookName("Mic")).toBe("Micah");
    expect(resolveBookName("Nah")).toBe("Nahum");
    expect(resolveBookName("Hab")).toBe("Habakkuk");
    expect(resolveBookName("Zeph")).toBe("Zephaniah");
    expect(resolveBookName("Hag")).toBe("Haggai");
    expect(resolveBookName("Zech")).toBe("Zechariah");
    expect(resolveBookName("Mal")).toBe("Malachi");
  });

  // ── New Testament abbreviations ──
  it("resolves Gospel abbreviations", () => {
    expect(resolveBookName("Matt")).toBe("Matthew");
    expect(resolveBookName("Mt")).toBe("Matthew");
    expect(resolveBookName("Mar")).toBe("Mark");
    expect(resolveBookName("Mk")).toBe("Mark");
    expect(resolveBookName("Luk")).toBe("Luke");
    expect(resolveBookName("Lk")).toBe("Luke");
    expect(resolveBookName("Jn")).toBe("John");
    expect(resolveBookName("Joh")).toBe("John");
  });

  it("resolves Pauline Epistle abbreviations", () => {
    expect(resolveBookName("Rom")).toBe("Romans");
    expect(resolveBookName("1Cor")).toBe("1 Corinthians");
    expect(resolveBookName("2Cor")).toBe("2 Corinthians");
    expect(resolveBookName("Gal")).toBe("Galatians");
    expect(resolveBookName("Eph")).toBe("Ephesians");
    expect(resolveBookName("Phil")).toBe("Philippians");
    expect(resolveBookName("Col")).toBe("Colossians");
    expect(resolveBookName("1Thess")).toBe("1 Thessalonians");
    expect(resolveBookName("2Thess")).toBe("2 Thessalonians");
    expect(resolveBookName("1Tim")).toBe("1 Timothy");
    expect(resolveBookName("2Tim")).toBe("2 Timothy");
    expect(resolveBookName("Tit")).toBe("Titus");
    expect(resolveBookName("Philem")).toBe("Philemon");
    expect(resolveBookName("Phm")).toBe("Philemon");
  });

  it("resolves General Epistle abbreviations", () => {
    expect(resolveBookName("Heb")).toBe("Hebrews");
    expect(resolveBookName("Jam")).toBe("James");
    expect(resolveBookName("Jas")).toBe("James");
    expect(resolveBookName("1Pet")).toBe("1 Peter");
    expect(resolveBookName("2Pet")).toBe("2 Peter");
    expect(resolveBookName("1Jn")).toBe("1 John");
    expect(resolveBookName("2Jn")).toBe("2 John");
    expect(resolveBookName("3Jn")).toBe("3 John");
    expect(resolveBookName("Jud")).toBe("Jude");
  });

  it("resolves Revelation abbreviations", () => {
    expect(resolveBookName("Rev")).toBe("Revelation");
    expect(resolveBookName("Apocalypse")).toBe("Revelation");
    expect(resolveBookName("Apoc")).toBe("Revelation");
  });

  // ── Roman numeral variants ──
  it("resolves Roman numeral book prefixes", () => {
    expect(resolveBookName("I Sam")).toBe("1 Samuel");
    expect(resolveBookName("II Sam")).toBe("2 Samuel");
    expect(resolveBookName("I Cor")).toBe("1 Corinthians");
    expect(resolveBookName("II Cor")).toBe("2 Corinthians");
    expect(resolveBookName("I Pet")).toBe("1 Peter");
    expect(resolveBookName("II Pet")).toBe("2 Peter");
    expect(resolveBookName("I Jn")).toBe("1 John");
    expect(resolveBookName("II Jn")).toBe("2 John");
    expect(resolveBookName("III Jn")).toBe("3 John");
  });

  // ── Unknown input ──
  it("returns undefined for unrecognized names", () => {
    expect(resolveBookName("FakeBook")).toBeUndefined();
    expect(resolveBookName("xyz")).toBeUndefined();
    expect(resolveBookName("")).toBeUndefined();
  });
});

describe("parseReference with abbreviations", () => {
  it('parses "Jn 3:16" → John 3:16', () => {
    const result = parseReference("Jn 3:16");
    expect(result).toEqual({
      book: "John",
      chapter: 3,
      startVerse: 16,
      endVerse: undefined,
    });
  });

  it('parses "1 Cor 13" → 1 Corinthians 13', () => {
    const result = parseReference("1 Cor 13");
    expect(result).toEqual({
      book: "1 Corinthians",
      chapter: 13,
      startVerse: undefined,
      endVerse: undefined,
    });
  });

  it('parses "Song 1:1" → Song of Solomon 1:1', () => {
    const result = parseReference("Song 1:1");
    expect(result).toEqual({
      book: "Song of Solomon",
      chapter: 1,
      startVerse: 1,
      endVerse: undefined,
    });
  });

  it('parses "Gen 1:1" → Genesis 1:1', () => {
    const result = parseReference("gen 1:1");
    expect(result).toEqual({
      book: "Genesis",
      chapter: 1,
      startVerse: 1,
      endVerse: undefined,
    });
  });

  it('parses "Rom 8:28-30" range with abbreviation', () => {
    const result = parseReference("Rom 8:28-30");
    expect(result).toEqual({
      book: "Romans",
      chapter: 8,
      startVerse: 28,
      endVerse: 30,
    });
  });

  it('parses "Ps 23" full chapter with abbreviation', () => {
    const result = parseReference("Ps 23");
    expect(result).toEqual({
      book: "Psalms",
      chapter: 23,
      startVerse: undefined,
      endVerse: undefined,
    });
  });
});

describe("book name map coverage", () => {
  it("all 66 canonical books are resolvable by their own name", () => {
    const books = getBooks();
    expect(books).toHaveLength(66);
    for (const b of books) {
      expect(resolveBookName(b.name)).toBe(b.name);
    }
  });

  it("every book has at least one abbreviation", () => {
    const books = getBooks();
    const canonicalLower = new Set(books.map((b) => b.name.toLowerCase()));

    // Collect which canonical names are reachable via abbreviation lookup
    // (i.e., resolveBookName returns the canonical name without matching the
    // canonical name itself)
    const reachedViaAbbr = new Set<string>();
    // We need to test by calling resolveBookName with a non-canonical input.
    // Since we can't easily enumerate the keys without importing the private map,
    // we verify that every canonical book has at least one abbreviation by
    // checking known abbreviations.

    // For each book, verify it can be resolved by a known abbreviation
    // that is NOT its canonical name.
    const spotChecks: [string, string][] = [
      ["Genesis", "Gen"], ["Exodus", "Exo"], ["Leviticus", "Lev"],
      ["Numbers", "Num"], ["Deuteronomy", "Deut"], ["Joshua", "Josh"],
      ["Judges", "Judg"], ["Ruth", "Rth"], ["1 Samuel", "1Sam"],
      ["2 Samuel", "2Sam"], ["1 Kings", "1Kgs"], ["2 Kings", "2Kgs"],
      ["1 Chronicles", "1Chr"], ["2 Chronicles", "2Chr"], ["Ezra", "Ezr"],
      ["Nehemiah", "Neh"], ["Esther", "Est"], ["Job", "Jb"],
      ["Psalms", "Ps"], ["Proverbs", "Prov"], ["Ecclesiastes", "Eccl"],
      ["Song of Solomon", "Song"], ["Isaiah", "Isa"], ["Jeremiah", "Jer"],
      ["Lamentations", "Lam"], ["Ezekiel", "Ezek"], ["Daniel", "Dan"],
      ["Hosea", "Hos"], ["Joel", "Joe"], ["Amos", "Amo"],
      ["Obadiah", "Obad"], ["Jonah", "Jon"], ["Micah", "Mic"],
      ["Nahum", "Nah"], ["Habakkuk", "Hab"], ["Zephaniah", "Zeph"],
      ["Haggai", "Hag"], ["Zechariah", "Zech"], ["Malachi", "Mal"],
      ["Matthew", "Matt"], ["Mark", "Mar"], ["Luke", "Luk"],
      ["John", "Jn"], ["Acts", "Act"], ["Romans", "Rom"],
      ["1 Corinthians", "1Cor"], ["2 Corinthians", "2Cor"], ["Galatians", "Gal"],
      ["Ephesians", "Eph"], ["Philippians", "Phil"], ["Colossians", "Col"],
      ["1 Thessalonians", "1Thess"], ["2 Thessalonians", "2Thess"],
      ["1 Timothy", "1Tim"], ["2 Timothy", "2Tim"], ["Titus", "Tit"],
      ["Philemon", "Philem"], ["Hebrews", "Heb"], ["James", "Jam"],
      ["1 Peter", "1Pet"], ["2 Peter", "2Pet"], ["1 John", "1Jn"],
      ["2 John", "2Jn"], ["3 John", "3Jn"], ["Jude", "Jud"],
      ["Revelation", "Rev"],
    ];

    expect(spotChecks).toHaveLength(66);

    for (const [canonical, abbr] of spotChecks) {
      const resolved = resolveBookName(abbr);
      if (resolved !== canonical) {
        // Debug: the abbreviation didn't resolve correctly
        throw new Error(`${abbr} resolved to ${resolved}, expected ${canonical}`);
      }
      expect(resolved).toBe(canonical);
    }
  });
});
