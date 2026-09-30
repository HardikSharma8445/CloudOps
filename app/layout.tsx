import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AWS Infrastructure Dashboard",
  description:
    "Internal infrastructure dashboard — UI prototype with mock data",
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
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="page-glow min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
