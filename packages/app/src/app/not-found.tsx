import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-sm font-medium text-neutral-400 dark:text-neutral-600 mb-2">
        404
      </p>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
        页面未找到
      </h1>
      <p className="text-neutral-500 dark:text-neutral-500 mb-6">
        您所查找的页面不存在。
      </p>
      <Link
        href="/"
        className="rounded-full bg-amber-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-amber-700 transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}
