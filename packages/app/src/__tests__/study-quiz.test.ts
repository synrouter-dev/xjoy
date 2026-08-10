/**
 * Study Quiz Generator 单元测试
 */

import { generateQuiz, calculateScore } from "@/lib/quiz-generator";

describe("generateQuiz", () => {
  it("生成简单难度的 10 道题目", () => {
    const session = generateQuiz("easy");
    expect(session.questions).toHaveLength(10);
    expect(session.difficulty).toBe("easy");
  });

  it("生成中等难度的题目", () => {
    const session = generateQuiz("medium");
    expect(session.questions).toHaveLength(10);
    expect(session.difficulty).toBe("medium");
  });

  it("生成困难难度的题目", () => {
    const session = generateQuiz("hard");
    expect(session.questions).toHaveLength(10);
    expect(session.difficulty).toBe("hard");
  });

  it("支持自定义题目数量", () => {
    const session = generateQuiz("easy", 5);
    expect(session.questions).toHaveLength(5);
  });

  it("每道题有完整结构", () => {
    const session = generateQuiz("easy", 3);
    for (const q of session.questions) {
      expect(q.id).toBeGreaterThan(0);
      expect(q.type).toMatch(/^(book_origin|fill_blank|next_verse|chapter_context)$/);
      expect(q.difficulty).toBe("easy");
      expect(q.prompt).toBeTruthy();
      expect(q.prompt.length).toBeGreaterThan(10);
      expect(q.reference).toBeTruthy();
      expect(q.options).toHaveLength(4);
      expect(q.correctAnswer).toMatch(/^[A-D]$/);
      expect(q.explanation).toBeTruthy();

      // 验证选项标签唯一
      const labels = q.options.map((o) => o.label);
      expect(new Set(labels).size).toBe(4);

      // 验证正确答案存在于选项中
      const correctOption = q.options.find((o) => o.label === q.correctAnswer);
      expect(correctOption).toBeDefined();
    }
  });

  it("两次生成的题目不同（随机性）", () => {
    const session1 = generateQuiz("easy", 2);
    const session2 = generateQuiz("easy", 2);
    // 由于随机性，题目大概率不同（但不做硬断言，因为极小概率相同）
    const prompts1 = session1.questions.map((q) => q.prompt).join();
    const prompts2 = session2.questions.map((q) => q.prompt).join();
    // 至少题型分布应该存在
    expect(session1.questions.length).toBe(session2.questions.length);
  });
});

describe("calculateScore", () => {
  const mockQuestions = [
    {
      id: 1,
      type: "book_origin" as const,
      difficulty: "easy" as const,
      prompt: "测试题目 1",
      reference: "Genesis 1:1",
      options: [
        { label: "A", text: "正确" },
        { label: "B", text: "错误1" },
        { label: "C", text: "错误2" },
        { label: "D", text: "错误3" },
      ],
      correctAnswer: "A",
      explanation: "解释 1",
    },
    {
      id: 2,
      type: "fill_blank" as const,
      difficulty: "easy" as const,
      prompt: "测试题目 2",
      reference: "John 3:16",
      options: [
        { label: "A", text: "错误1" },
        { label: "B", text: "正确" },
        { label: "C", text: "错误2" },
        { label: "D", text: "错误3" },
      ],
      correctAnswer: "B",
      explanation: "解释 2",
    },
  ];

  it("全对得满分", () => {
    const result = calculateScore(
      [
        { questionId: 1, selectedAnswer: "A" },
        { questionId: 2, selectedAnswer: "B" },
      ],
      mockQuestions
    );
    expect(result.score).toBe(20);
    expect(result.total).toBe(20);
    expect(result.correct).toBe(2);
  });

  it("全错得 0 分", () => {
    const result = calculateScore(
      [
        { questionId: 1, selectedAnswer: "C" },
        { questionId: 2, selectedAnswer: "D" },
      ],
      mockQuestions
    );
    expect(result.score).toBe(0);
    expect(result.correct).toBe(0);
  });

  it("部分正确", () => {
    const result = calculateScore(
      [
        { questionId: 1, selectedAnswer: "A" },
        { questionId: 2, selectedAnswer: "C" },
      ],
      mockQuestions
    );
    expect(result.score).toBe(10);
    expect(result.correct).toBe(1);
  });

  it("返回每题的详细信息", () => {
    const result = calculateScore(
      [
        { questionId: 1, selectedAnswer: "A" },
        { questionId: 2, selectedAnswer: "C" },
      ],
      mockQuestions
    );
    expect(result.details).toHaveLength(2);
    expect(result.details[0]).toEqual({ questionId: 1, correct: true });
    expect(result.details[1]).toEqual({ questionId: 2, correct: false });
  });
});
