/**
 * Weekly Jigsaw Generator 单元测试
 */

import {
  generateWeeklyJigsaw,
  checkJigsawSolution,
  calculateJigsawScore,
} from "@/lib/jigsaw-generator";

describe("generateWeeklyJigsaw", () => {
  it("生成本周拼图题目", () => {
    const puzzle = generateWeeklyJigsaw();

    // 基本结构
    expect(puzzle.id).toMatch(/^jigsaw-\d{4}-w\d+$/);
    expect(puzzle.book).toBeTruthy();
    expect(puzzle.chapter).toBeGreaterThan(0);
    expect(puzzle.verseCount).toBeGreaterThan(0);
    expect(puzzle.pieceCount).toBeGreaterThanOrEqual(4);
    expect(puzzle.pieceCount).toBeLessThanOrEqual(8);
    expect(puzzle.pieces).toHaveLength(puzzle.pieceCount);

    // 周信息
    expect(puzzle.year).toBeGreaterThanOrEqual(2025);
    expect(puzzle.weekNumber).toBeGreaterThanOrEqual(1);
    expect(puzzle.weekNumber).toBeLessThanOrEqual(53);
    expect(puzzle.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // 每个片段
    for (const piece of puzzle.pieces) {
      expect(piece.id).toBeGreaterThan(0);
      expect(piece.text).toBeTruthy();
      expect(piece.text.length).toBeGreaterThan(5);
      expect(piece.originalPosition).toBeGreaterThanOrEqual(1);
      expect(piece.originalPosition).toBeLessThanOrEqual(puzzle.pieceCount);
      expect(piece.verses).toBeTruthy();
    }

    // 所有 originalPosition 构成完整序列
    const positions = puzzle.pieces.map((p) => p.originalPosition).sort((a, b) => a - b);
    for (let i = 0; i < positions.length; i++) {
      expect(positions[i]).toBe(i + 1);
    }
  });

  it("同一周生成相同的题目（确定性）", () => {
    const puzzle1 = generateWeeklyJigsaw();
    const puzzle2 = generateWeeklyJigsaw();

    expect(puzzle1.id).toBe(puzzle2.id);
    expect(puzzle1.book).toBe(puzzle2.book);
    expect(puzzle1.chapter).toBe(puzzle2.chapter);
    expect(puzzle1.pieceCount).toBe(puzzle2.pieceCount);

    // 片段顺序应相同（基于同一个种子）
    for (let i = 0; i < puzzle1.pieces.length; i++) {
      expect(puzzle1.pieces[i].originalPosition).toBe(
        puzzle2.pieces[i].originalPosition
      );
    }
  });
});

describe("checkJigsawSolution", () => {
  const mockPuzzle = {
    id: "jigsaw-2026-w1",
    book: "Genesis",
    chapter: 1,
    verseCount: 31,
    pieceCount: 4,
    pieces: [
      {
        id: 3,
        text: "片段 C（第 3 位）",
        originalPosition: 3,
        verses: "16-23",
      },
      {
        id: 1,
        text: "片段 A（第 1 位）",
        originalPosition: 1,
        verses: "1-8",
      },
      {
        id: 4,
        text: "片段 D（第 4 位）",
        originalPosition: 4,
        verses: "24-31",
      },
      {
        id: 2,
        text: "片段 B（第 2 位）",
        originalPosition: 2,
        verses: "9-15",
      },
    ],
    weekStart: "2026-01-05",
    weekNumber: 1,
    year: 2026,
  };

  it("完全正确的排序得满分", () => {
    // 正确顺序：按 originalPosition 排列 → [1, 2, 3, 4]
    const result = checkJigsawSolution(mockPuzzle, [1, 2, 3, 4]);
    expect(result.correct).toBe(true);
    expect(result.accuracy).toBe(1);
    expect(result.score).toBe(100);
  });

  it("部分正确", () => {
    // 2 个位置正确
    const result = checkJigsawSolution(mockPuzzle, [1, 2, 4, 3]);
    expect(result.correct).toBe(false);
    expect(result.accuracy).toBe(0.5);
    expect(result.score).toBe(50);
  });

  it("完全错误", () => {
    const result = checkJigsawSolution(mockPuzzle, [4, 3, 2, 1]);
    // 如果完全反转，可能全部位置都错
    expect(result.correct).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

describe("calculateJigsawScore", () => {
  it("完美准确且快速完成得 S", () => {
    const result = calculateJigsawScore(1.0, 30, 4);
    expect(result.score).toBe(100);
    expect(result.grade).toContain("S");
  });

  it("高准确但慢速", () => {
    const result = calculateJigsawScore(0.8, 300, 4);
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.score).toBeLessThan(100);
  });

  it("低准确度", () => {
    const result = calculateJigsawScore(0.25, 60, 4);
    expect(result.score).toBeLessThanOrEqual(40);
  });

  it("6 片时的时间阈值更高", () => {
    // 6 片 × 15 秒 = 90 秒目标时间
    const fast = calculateJigsawScore(1.0, 30, 6);
    expect(fast.score).toBe(100);

    const slow = calculateJigsawScore(1.0, 200, 6);
    expect(slow.score).toBeLessThan(100);
  });
});
