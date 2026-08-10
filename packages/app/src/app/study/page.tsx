import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study 游戏化学习 — Xjoy",
  description: "通过 Bible Quiz 和 Weekly Jigsaw 游戏化方式深入学习圣经。",
};

export default function StudyPage() {
  return (
    <div className="min-h-[80vh]">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          📖 Study 游戏化学习
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          通过互动游戏加深对经文的理解与记忆。寓学于乐，灵命成长。
        </p>
      </div>

      {/* 游戏卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Bible Quiz */}
        <Link
          href="/study/quiz"
          className="group block p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">📝</span>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                Bible Quiz
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                每日 5 道 KJV 经文选择题。答对 ≥ 3 题即可收集拼图碎片，四种题型轮换。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["每日更新", "经文归属", "填空补全", "上下文接龙"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="inline-flex text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Weekly Jigsaw */}
        <Link
          href="/study/jigsaw"
          className="group block p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">🧩</span>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                Weekly Jigsaw
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                拼图碎片收集。每天答对 Quiz 即可收集一片，集齐 7 片解锁每周经文主题。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["每日收集", "每周主题", "经文解锁", "连续挑战"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="inline-flex text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* 学习提示 */}
      <div className="mt-10 p-5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
          💡 <strong>学习建议</strong>：每天完成 Quiz 收集拼图碎片，坚持 7 天解锁每周经文主题。先答题检验知识，再通过拼图激励持续学习。
        </p>
      </div>

      {/* 学习统计入口 */}
      <div className="mt-6">
        <Link
          href="/study/stats"
          className="group block p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                学习统计
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                查看正确率、连续天数、完成章节等学习数据
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
