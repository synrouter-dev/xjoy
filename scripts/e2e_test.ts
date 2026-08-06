/**
 * End-to-end RAG pipeline test.
 *
 * Tests the full pipeline against a real database and LLM API.
 * Requires: PostgreSQL running, .env configured with ANTHROPIC_API_KEY.
 *
 * Usage:
 *   npx tsx scripts/e2e_test.ts
 *   npx tsx scripts/e2e_test.ts --fts-only    (skip LLM, test retrieval only)
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

// Load .env before any other imports
dotenv.config({ path: resolve(__dirname, "..", ".env") });

async function main() {
  const { retrieveVerses, buildPrompt, parseResponse } = await import("../src/lib/rag");
  const { generateResponse } = await import("../src/lib/claude");

  const args = process.argv.slice(2);
  const ftsOnly = args.includes("--fts-only");

  const query = "What does the Bible say about love?";
  console.log("╔══════════════════════════════════════════╗");
  console.log("║     Xjoy — E2E RAG Pipeline Test         ║");
  console.log("╚══════════════════════════════════════════╝\n");

  console.log("Query:", query);
  console.log("---");

  // ── Step 1: Retrieve verses ──
  console.log("\n[1/4] Retrieving verses...");
  const startRetrieve = Date.now();
  const verses = await retrieveVerses(query, 12);
  const retrieveMs = Date.now() - startRetrieve;

  console.log(`  Retrieved ${verses.length} verses in ${retrieveMs}ms:`);
  for (const v of verses.slice(0, 5)) {
    console.log(
      `  [${v.book} ${v.chapter}:${v.verse}] (rank: ${v.rank.toFixed(3)}) ${v.text.slice(0, 100)}...`
    );
  }
  if (verses.length > 5) {
    console.log(`  ... and ${verses.length - 5} more`);
  }

  if (verses.length === 0) {
    console.log("\n❌ FAIL: No verses retrieved. Check database configuration.");
    process.exit(1);
  }

  // ── Step 2: Build prompt ──
  console.log("\n[2/4] Building prompt...");
  const { systemPrompt, userMessage } = buildPrompt(query, verses);
  console.log(`  System prompt: ${systemPrompt.length} chars`);
  console.log(`  User message: ${userMessage.length} chars`);

  if (ftsOnly) {
    console.log("\n✓ FTS-only mode — skipping LLM call.");
    console.log("  Retrieval test: PASS");
    process.exit(0);
  }

  // ── Step 3: Generate ──
  console.log("\n[3/4] Calling LLM...");
  let result;
  try {
    const startLLM = Date.now();
    result = await generateResponse(systemPrompt, userMessage, {
      maxTokens: 1024,
      temperature: 0.3,
    });
    const llmMs = Date.now() - startLLM;
    console.log(`  LLM responded in ${llmMs}ms`);
    console.log(`  Tokens: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ANTHROPIC_API_KEY")) {
      console.log("\n❌ FAIL: ANTHROPIC_API_KEY not configured.");
      console.log("  Set it in .env and try again.");
      process.exit(1);
    }
    throw err;
  }

  // ── Step 4: Parse ──
  console.log("\n[4/4] Parsing response...");
  const { answer, citations, fabricationWarning } = parseResponse(
    result.content,
    verses
  );

  const totalMs = retrieveMs + (Date.now() - (Date.now() - retrieveMs));
  const totalLatency = retrieveMs + (Date.now() - retrieveMs); // wrong calculation

  console.log("\n┌──────────────────────────────────────────┐");
  console.log("│              AI Response                 │");
  console.log("└──────────────────────────────────────────┘\n");
  console.log(answer);
  console.log("\n┌──────────────────────────────────────────┐");
  console.log("│              Citations                   │");
  console.log("└──────────────────────────────────────────┘\n");
  for (const c of citations) {
    console.log(`  [${c.book} ${c.chapter}:${c.verse}] ${c.text.slice(0, 120)}...`);
  }

  if (citations.length === 0) {
    console.log("  (no structured citations extracted)");
  }

  console.log("\n┌──────────────────────────────────────────┐");
  console.log("│              Diagnostics                 │");
  console.log("└──────────────────────────────────────────┘");
  console.log(`  Verses retrieved: ${verses.length}`);
  console.log(`  Citations found:  ${citations.length}`);
  console.log(`  Fabrication warn: ${fabricationWarning?.detected ? "⚠ YES" : "✓ NO"}`);
  if (fabricationWarning?.detected) {
    console.log(`  Suspect passages: ${fabricationWarning.suspectPassages.length}`);
    for (const p of fabricationWarning.suspectPassages.slice(0, 3)) {
      console.log(`    - "${p.slice(0, 80)}..."`);
    }
  }

  // ── Verdict ──
  console.log("\n┌──────────────────────────────────────────┐");
  console.log("│              Verdict                     │");
  console.log("└──────────────────────────────────────────┘");

  const checks: { name: string; pass: boolean; detail: string }[] = [
    {
      name: "Retrieval",
      pass: verses.length >= 3,
      detail: `${verses.length} verses (need ≥ 3)`,
    },
    {
      name: "Citations",
      pass: citations.length >= 1,
      detail: `${citations.length} citations (need ≥ 1)`,
    },
    {
      name: "No Fabrication",
      pass: !fabricationWarning?.detected,
      detail: fabricationWarning?.detected
        ? `Found ${fabricationWarning.suspectPassages.length} suspect passages`
        : "clean",
    },
    {
      name: "Response Quality",
      pass: answer.length > 50,
      detail: `${answer.length} chars (need > 50)`,
    },
  ];

  let allPass = true;
  for (const check of checks) {
    const icon = check.pass ? "✓" : "✗";
    console.log(`  ${icon} ${check.name}: ${check.detail}`);
    if (!check.pass) allPass = false;
  }

  console.log(
    `\n  ${allPass ? "✓ ALL CHECKS PASSED" : "✗ SOME CHECKS FAILED"}`
  );

  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("\n╔══════════════════════════════════════════╗");
  console.error("║           FATAL ERROR                   ║");
  console.error("╚══════════════════════════════════════════╝");
  console.error(err);
  process.exit(1);
});
