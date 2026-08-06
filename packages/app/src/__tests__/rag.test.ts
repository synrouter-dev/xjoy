/**
 * RAG pipeline unit tests.
 *
 * Tests prompt construction, citation extraction, and
 * system prompt safety rules — the parts of the pipeline
 * that don't require database or API access.
 */

import { describe, it, expect } from "@jest/globals";
import {
  buildPrompt,
  extractCitations,
  formatVerseContext,
  detectFabrications,
  SYSTEM_PROMPT,
} from "@xjoy/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeVerse(overrides: Partial<{
  id: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  rank: number;
}> = {}) {
  return {
    id: overrides.id ?? 1,
    book: overrides.book ?? "John",
    chapter: overrides.chapter ?? 3,
    verse: overrides.verse ?? 16,
    text: overrides.text ?? "For God so loved the world...",
    rank: overrides.rank ?? 0.5,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("formatVerseContext", () => {
  it("returns placeholder when no verses provided", () => {
    const result = formatVerseContext([]);
    expect(result).toContain("No relevant verses found");
  });

  it("formats a single verse with reference", () => {
    const verse = makeVerse({ book: "John", chapter: 3, verse: 16, text: "For God so loved the world..." });
    const result = formatVerseContext([verse]);
    expect(result).toContain("[John 3:16]");
    expect(result).toContain("For God so loved the world...");
  });

  it("formats multiple verses", () => {
    const verses = [
      makeVerse({ book: "John", chapter: 3, verse: 16, text: "For God so loved the world...", id: 1 }),
      makeVerse({ book: "Romans", chapter: 8, verse: 28, text: "And we know that all things work together...", id: 2 }),
    ];
    const result = formatVerseContext(verses);
    expect(result).toContain("[John 3:16]");
    expect(result).toContain("[Romans 8:28]");
    expect(result.indexOf("[John 3:16]")).toBeLessThan(
      result.indexOf("[Romans 8:28]")
    );
  });
});

describe("buildPrompt", () => {
  it("includes the system prompt", () => {
    const verses = [makeVerse()];
    const { systemPrompt } = buildPrompt("test query", verses);
    expect(systemPrompt).toContain(SYSTEM_PROMPT);
  });

  it("includes verse context in system prompt", () => {
    const verses = [makeVerse({ book: "Genesis", chapter: 1, verse: 1, text: "In the beginning..." })];
    const { systemPrompt } = buildPrompt("creation", verses);
    expect(systemPrompt).toContain("[Genesis 1:1]");
    expect(systemPrompt).toContain("In the beginning...");
  });

  it("uses conversation history when provided", () => {
    const verses = [makeVerse()];
    const history = [
      { role: "user" as const, content: "Hello" },
      { role: "assistant" as const, content: "Hi there" },
    ];
    const { userMessage } = buildPrompt("follow up", verses, history);
    expect(userMessage).toContain("Hello");
    expect(userMessage).toContain("Hi there");
    expect(userMessage).toContain("follow up");
  });

  it("uses plain query when no history", () => {
    const verses = [makeVerse()];
    const { userMessage } = buildPrompt("test", verses);
    expect(userMessage).toBe("test");
  });
});

describe("extractCitations", () => {
  it("extracts a single citation", () => {
    const contextVerses = [
      makeVerse({ book: "John", chapter: 3, verse: 16, text: "For God so loved the world..." }),
    ];
    const response = "As we read in John 3:16, God's love is central.";
    const citations = extractCitations(response, contextVerses);
    expect(citations).toHaveLength(1);
    expect(citations[0]).toMatchObject({
      book: "John",
      chapter: 3,
      verse: 16,
    });
  });

  it("extracts multiple citations", () => {
    const contextVerses = [
      makeVerse({ id: 1, book: "John", chapter: 3, verse: 16, text: "For God so loved the world..." }),
      makeVerse({ id: 2, book: "Romans", chapter: 8, verse: 28, text: "And we know..." }),
    ];
    const response =
      "John 3:16 speaks of God's love, and Romans 8:28 reminds us of His purpose.";
    const citations = extractCitations(response, contextVerses);
    expect(citations).toHaveLength(2);
  });

  it("does not extract citations not in context", () => {
    const contextVerses = [
      makeVerse({ book: "Psalms", chapter: 23, verse: 1, text: "The Lord is my shepherd..." }),
    ];
    // Matthew 5:3 is not in context, so it should be excluded
    const response = "Consider Matthew 5:3 blessed are the poor.";
    const citations = extractCitations(response, contextVerses);
    // Only Psalms is in context, Matthew is not
    expect(citations).toHaveLength(0);
  });

  it("fuzzy-matches book names (Psalm → Psalms)", () => {
    const contextVerses = [
      makeVerse({ book: "Psalms", chapter: 23, verse: 1, text: "The Lord is my shepherd..." }),
    ];
    const response = "As written in Psalm 23:1, the Lord is my shepherd.";
    const citations = extractCitations(response, contextVerses);
    expect(citations).toHaveLength(1);
    // Uses canonical DB name "Psalms"
    expect(citations[0].book).toBe("Psalms");
  });

  it("deduplicates repeated citations", () => {
    const contextVerses = [
      makeVerse({ book: "John", chapter: 3, verse: 16, text: "For God so loved the world..." }),
    ];
    const response = "John 3:16 is key. Again, John 3:16 shows us...";
    const citations = extractCitations(response, contextVerses);
    expect(citations).toHaveLength(1);
  });

  it("handles numbered books (1 Corinthians, 2 Kings)", () => {
    const contextVerses = [
      makeVerse({ id: 1, book: "1 Corinthians", chapter: 13, verse: 4, text: "Charity suffereth long..." }),
      makeVerse({ id: 2, book: "2 Kings", chapter: 2, verse: 11, text: "And it came to pass..." }),
    ];
    const response =
      "1 Corinthians 13:4 defines charity, and 2 Kings 2:11 describes Elijah's departure.";
    const citations = extractCitations(response, contextVerses);
    expect(citations).toHaveLength(2);
  });

  it("handles Psalms (no number prefix, fuzzy match)", () => {
    const contextVerses = [
      makeVerse({ book: "Psalms", chapter: 23, verse: 1, text: "The Lord is my shepherd..." }),
    ];
    const response = "Psalm 23:1 begins the beloved shepherd psalm.";
    const citations = extractCitations(response, contextVerses);
    // Fuzzy matching maps "Psalm" → "Psalms"
    expect(citations).toHaveLength(1);
    expect(citations[0].book).toBe("Psalms");
  });
});

describe("SYSTEM_PROMPT", () => {
  it("includes no-fabrication rule", () => {
    expect(SYSTEM_PROMPT).toContain("No Fabrication");
    expect(SYSTEM_PROMPT).toContain("NEVER quote");
  });

  it("includes citation requirement", () => {
    expect(SYSTEM_PROMPT).toContain("Citation Required");
    expect(SYSTEM_PROMPT).toContain("EVERY time");
  });

  it("includes grounding instruction", () => {
    expect(SYSTEM_PROMPT).toContain("ONLY the KJV verses provided");
  });
});

describe("detectFabrications", () => {
  it("detects quoted text not in context verses", () => {
    const contextVerses = [
      makeVerse({ book: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." }),
    ];
    const response = 'The Bible says "Blessed are the cheesemakers for they shall inherit the earth" and this is an important teaching.';
    const result = detectFabrications(response, contextVerses);
    expect(result.detected).toBe(true);
    expect(result.suspectPassages).toHaveLength(1);
  });

  it("does not flag quoted text that appears in context verses", () => {
    const contextVerses = [
      makeVerse({ book: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." }),
    ];
    const response = 'As Jesus taught, "For God so loved the world, that he gave his only begotten Son" shows divine love.';
    const result = detectFabrications(response, contextVerses);
    expect(result.detected).toBe(false);
  });

  it("ignores short quotes under minimum length", () => {
    const contextVerses = [
      makeVerse({ book: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want." }),
    ];
    const response = 'The psalmist says "The LORD" is central.';
    const result = detectFabrications(response, contextVerses);
    // Short quotes (< 40 chars) are not checked
    expect(result.detected).toBe(false);
  });

  it("handles smart quotes (curly quotes)", () => {
    const contextVerses = [
      makeVerse({ book: "John", chapter: 3, verse: 16, text: "For God so loved the world" }),
    ];
    const response = 'The passage “For God so loved the world” is famous.';
    const result = detectFabrications(response, contextVerses);
    expect(result.detected).toBe(false);
  });

  it("returns empty array when no fabrications detected", () => {
    const contextVerses = [
      makeVerse({ book: "Romans", chapter: 8, verse: 28, text: "And we know that all things work together for good to them that love God" }),
    ];
    const response = 'Paul reminds us that "all things work together for good to them that love God" which is encouraging.';
    const result = detectFabrications(response, contextVerses);
    expect(result.detected).toBe(false);
    expect(result.suspectPassages).toHaveLength(0);
  });
});
