import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xjoy — AI-Powered KJV Bible",
  description:
    "An intelligent, reverent interface to the timeless text of the King James Bible. Ask questions, search scripture, and explore the Word.",
  keywords: ["Bible", "KJV", "King James", "Scripture", "AI Bible", "Xjoy"],
  openGraph: {
    title: "Xjoy — AI-Powered KJV Bible",
    description:
      "An intelligent interface to the King James Bible. Ask questions, search scripture, explore the text.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen font-serif">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 md:ml-56 pb-20 md:pb-12 px-4 sm:px-6 md:px-12 pt-8 md:pt-12">
              <div className="max-w-3xl mx-auto">{children}</div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
