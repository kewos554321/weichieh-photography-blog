import { NextRequest, NextResponse } from "next/server";
import { publishScheduledContent } from "@/lib/publish";

// GET /api/cron/publish - 自動發佈到期的排程內容
// 可由 Vercel Cron 或手動觸發
export async function GET(request: NextRequest) {
  try {
    // 驗證 cron secret (可選，用於 Vercel Cron)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await publishScheduledContent();

    return NextResponse.json({
      success: true,
      publishedArticles: result.publishedArticles,
      publishedPhotos: result.publishedPhotos,
      timestamp: result.timestamp.toISOString(),
    });
  } catch (error) {
    console.error("Cron publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish scheduled content" },
      { status: 500 }
    );
  }
}

// POST /api/cron/publish - 手動觸發發布（需要 admin 權限）
export async function POST(_request: NextRequest) {
  try {
    // 這裡可以加入 admin 認證檢查
    const result = await publishScheduledContent();

    return NextResponse.json({
      success: true,
      publishedArticles: result.publishedArticles,
      publishedPhotos: result.publishedPhotos,
      timestamp: result.timestamp.toISOString(),
      message: result.publishedArticles + result.publishedPhotos > 0
        ? `已發布 ${result.publishedArticles} 篇文章和 ${result.publishedPhotos} 張照片`
        : "目前沒有待發布的排程內容",
    });
  } catch (error) {
    console.error("Manual publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish scheduled content" },
      { status: 500 }
    );
  }
}
