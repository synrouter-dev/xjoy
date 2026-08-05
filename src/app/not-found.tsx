import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-sm font-medium text-neutral-400 dark:text-neutral-600 mb-2">
        404
      </p>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
        Page not found
      </h1>
      <p className="text-neutral-500 dark:text-neutral-500 mb-6">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Go home
      </Link>
    </div>
  );
}
