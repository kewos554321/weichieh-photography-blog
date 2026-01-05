import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Noto_Serif_TC, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";

// English fonts
const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Chinese fonts - 思源宋體 & 思源黑體
const notoSerifTC = Noto_Serif_TC({
  variable: "--font-serif-tc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-sans-tc",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WeiChieh Photography",
  description: "一張圖片一個故事 - Photography by WeiChieh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${inter.variable} ${notoSerifTC.variable} ${notoSansTC.variable} antialiased bg-[var(--background)] text-[var(--foreground)] min-h-screen flex flex-col transition-colors duration-300`}
      >
        <ThemeProvider>
          <ToastProvider>
            {/* Cinematic overlays */}
            <div className="vignette" />
            <div className="film-grain" />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
