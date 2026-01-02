import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cron/publish - 自動發佈到期的排程內容
export async function GET(request: NextRequest) {
  try {
    // 驗證 cron secret (可選，用於 Vercel Cron)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 更新到期的排程文章
    const articlesResult = await prisma.article.updateMany({
      where: {
        status: "scheduled",
        publishedAt: {
          lte: now,
        },
      },
      data: {
        status: "published",
      },
    });

    // 更新到期的排程照片
    const photosResult = await prisma.photo.updateMany({
      where: {
        status: "scheduled",
        publishedAt: {
          lte: now,
        },
      },
      data: {
        status: "published",
      },
    });

    return NextResponse.json({
      success: true,
      publishedArticles: articlesResult.count,
      publishedPhotos: photosResult.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish scheduled content" },
      { status: 500 }
    );
  }
}
