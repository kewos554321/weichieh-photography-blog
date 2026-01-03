import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface SEOSettings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string[];
  ogImage: string;
  twitterHandle: string;
  googleAnalyticsId: string;
  googleSearchConsoleId: string;
  facebookPixelId: string;
}

const DEFAULT_SEO: SEOSettings = {
  siteTitle: "WeiChieh Photography",
  siteDescription: "A photography blog capturing moments and stories through the lens",
  siteKeywords: ["photography", "blog", "portrait", "landscape", "street"],
  ogImage: "",
  twitterHandle: "",
  googleAnalyticsId: "",
  googleSearchConsoleId: "",
  facebookPixelId: "",
};

// GET /api/settings/seo - 取得 SEO 設定
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: "seo" },
    });

    if (!settings) {
      return NextResponse.json(DEFAULT_SEO);
    }

    const seo = {
      ...DEFAULT_SEO,
      ...(settings.value as object),
    };

    return NextResponse.json(seo);
  } catch (error) {
    console.error("Get SEO settings error:", error);
    return NextResponse.json(
      { error: "Failed to get SEO settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/seo - 更新 SEO 設定
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    const seo: SEOSettings = {
      siteTitle: data.siteTitle || DEFAULT_SEO.siteTitle,
      siteDescription: data.siteDescription || DEFAULT_SEO.siteDescription,
      siteKeywords: data.siteKeywords || DEFAULT_SEO.siteKeywords,
      ogImage: data.ogImage || "",
      twitterHandle: data.twitterHandle || "",
      googleAnalyticsId: data.googleAnalyticsId || "",
      googleSearchConsoleId: data.googleSearchConsoleId || "",
      facebookPixelId: data.facebookPixelId || "",
    };

    const settings = await prisma.siteSettings.upsert({
      where: { key: "seo" },
      update: { value: seo as unknown as Prisma.InputJsonValue },
      create: { key: "seo", value: seo as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json(settings.value);
  } catch (error) {
    console.error("Update SEO settings error:", error);
    return NextResponse.json(
      { error: "Failed to update SEO settings" },
      { status: 500 }
    );
  }
}
