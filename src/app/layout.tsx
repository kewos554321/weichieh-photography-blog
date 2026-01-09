import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Noto_Serif_TC, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import { WebsiteJsonLd, PersonJsonLd } from "@/components/JsonLd";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

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

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://weichieh.photography";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "WeiChieh Photography",
    template: "%s | WeiChieh Photography",
  },
  description: "一張圖片一個故事 - Photography by WeiChieh。用相機捕捉生活中的美好瞬間，分享攝影作品與故事。",
  keywords: ["攝影", "Photography", "WeiChieh", "風景攝影", "人像攝影", "底片", "Film", "台灣"],
  authors: [{ name: "WeiChieh" }],
  creator: "WeiChieh",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: BASE_URL,
    siteName: "WeiChieh Photography",
    title: "WeiChieh Photography",
    description: "一張圖片一個故事 - Photography by WeiChieh。用相機捕捉生活中的美好瞬間，分享攝影作品與故事。",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "WeiChieh Photography",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WeiChieh Photography",
    description: "一張圖片一個故事 - Photography by WeiChieh",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <WebsiteJsonLd />
        <PersonJsonLd />
        <GoogleAnalytics />
      </head>
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
