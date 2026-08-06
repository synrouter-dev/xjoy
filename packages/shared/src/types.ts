/** Core domain types shared across all Xjoy packages. */

export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface VerseSearchResult extends Verse {
  rank: number;
}

export interface Citation {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface CrossRef {
  from_book: string;
  from_chapter: number;
  from_verse: number;
  to_book: string;
  to_chapter: number;
  to_verse_start: number;
  to_verse_end: number;
  votes: number;
}

export interface VerseCitation {
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
