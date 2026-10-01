import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { GlobalSearchProvider } from "@/components/GlobalSearch";
import { FilterProvider } from "@/components/FilterContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CloudOps Platform",
  description: "Internal CloudOps and DevOps Operations Platform for AWS Infrastructure",
};

/**
 * Runs before first paint so the stored theme is applied without a flash.
 * Dark is the default; an explicit user choice in localStorage wins.
 */
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('dashboard-theme');
    if (stored !== 'light') document.documentElement.classList.add('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-canvas text-ink antialiased`}
      >
        <GlobalSearchProvider>
          <FilterProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="page-glow min-w-0 flex-1 pb-16 md:pb-0">{children}</main>
            </div>
          </FilterProvider>
        </GlobalSearchProvider>
      </body>
    </html>
  );
}
