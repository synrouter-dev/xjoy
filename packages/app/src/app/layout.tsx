import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

export const metadata: Metadata = {
  title: "Xjoy — AI 智慧圣经",
  description:
    "基于 AI 的 KJV 圣经应用——一个现代化、易用、智能的经文交互体验。",
  keywords: ["圣经", "KJV", "King James", "经文", "AI 圣经", "Xjoy"],
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Xjoy",
  },
  openGraph: {
    title: "Xjoy — AI 智慧圣经",
    description:
      "基于 AI 的 KJV 圣经应用——智能的经文交互体验。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased min-h-screen font-serif">
        <ThemeProvider>
          <ServiceWorkerRegistration />
          <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 md:ml-56 pb-20 md:pb-12 px-4 sm:px-6 md:px-12 pt-6 md:pt-12">
              <div className="max-w-3xl mx-auto">{children}</div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
