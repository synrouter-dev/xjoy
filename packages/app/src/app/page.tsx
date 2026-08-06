import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <div className="max-w-xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 text-neutral-900 dark:text-neutral-100">
          Xjoy
        </h1>
        <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 mb-2 leading-relaxed">
          AI 驱动的 KJV 圣经应用
        </p>
        <p className="text-base text-neutral-500 dark:text-neutral-500 mb-10 leading-relaxed">
          基于经文原文的智能问答、经文搜索与阅读体验。
          AI 回答忠实于 KJV 文本，辅助理解而非替代牧者权威。
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/reader"
            className="inline-flex items-center justify-center rounded-full bg-amber-600 dark:bg-amber-600 text-white px-8 py-3 text-base font-medium hover:bg-amber-700 dark:hover:bg-amber-500 transition-colors"
          >
            开始读经
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 px-8 py-3 text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            AI 问答
          </Link>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-xl">
        {[
          {
            title: "AI 问答",
            desc: "就经文提出神学和历史问题，获得基于原文的回答。",
          },
          {
            title: "读经",
            desc: "按书卷和章节浏览 KJV 全文。",
          },
          {
            title: "搜索",
            desc: "按关键词、短语或主题搜索经文。",
          },
        ].map(({ title, desc }) => (
          <div
            key={title}
            className="text-left p-4 rounded-lg border border-neutral-200 dark:border-neutral-800"
          >
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              {title}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
