import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f7f5f2] text-stone-800 min-h-screen flex flex-col`}
      >
        {/* Cinematic overlays */}
        <div className="vignette" />
        <div className="film-grain" />
        {children}
      </body>
    </html>
  );
}
