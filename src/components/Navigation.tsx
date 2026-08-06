"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/reader", label: "Reader" },
  { href: "/chat", label: "Chat" },
  { href: "/search", label: "Search" },
  { href: "/feedback", label: "Feedback" },
] as const;

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="w-5 h-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const { resolved, toggle } = useTheme();

  return (
    <>
      {/* Desktop: left sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-56 md:border-r md:border-neutral-200 dark:md:border-neutral-800 md:bg-white/80 dark:md:bg-neutral-950/80 md:backdrop-blur-sm">
        <div className="flex flex-col h-full px-4 py-6">
          {/* Brand */}
          <Link
            href="/"
            className="text-xl font-bold tracking-tight mb-10 hover:opacity-80 transition-opacity"
          >
            Xjoy
          </Link>

          {/* Nav links */}
          <nav className="flex flex-col gap-1" aria-label="Main navigation">
            {NAV_ITEMS.map(({ href, label }) => {
              const active =
                href === "/"
                  ? pathname === href
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
          >
            {resolved === "dark" ? <SunIcon /> : <MoonIcon />}
            <span className="md:inline">
              {resolved === "dark" ? "Light" : "Dark"}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile: bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800 safe-area-bottom"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around h-14 px-2">
          {NAV_ITEMS.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === href
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-0 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  active
                    ? "text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
          <button
            onClick={toggle}
            className="flex flex-col items-center justify-center gap-0.5 min-w-0 px-3 py-1 rounded-md text-xs font-medium text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
          >
            {resolved === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>
    </>
  );
}
