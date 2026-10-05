import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AuthBanner from "@/components/AuthBanner";
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
 * `viewportFit: "cover"` lets the layout use the full screen on notched phones;
 * the safe-area padding below keeps content clear of the system UI.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Runs before first paint so the stored theme is applied without a flash.
 * Light is the default; an explicit user choice in localStorage wins.
 */
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('dashboard-theme');
    if (stored === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {
    // Light mode is default, do nothing
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
              <div className="flex min-w-0 flex-1 flex-col">
                <AuthBanner />
                <main className="page-glow nav-offset flex-1 md:pb-0">
                  {children}
                </main>
              </div>
            </div>
          </FilterProvider>
        </GlobalSearchProvider>
      </body>
    </html>
  );
}
