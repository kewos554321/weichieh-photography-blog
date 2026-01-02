import { prisma } from "./prisma";

export interface PublishResult {
  publishedArticles: number;
  publishedPhotos: number;
  timestamp: Date;
}

/**
 * 檢查並發布所有到期的排程內容
 * 這個函數可以在任何 API 請求時調用，確保排程內容即時發布
 */
export async function publishScheduledContent(): Promise<PublishResult> {
  const now = new Date();

  // 並行更新文章和照片
  const [articlesResult, photosResult] = await Promise.all([
    prisma.article.updateMany({
      where: {
        status: "scheduled",
        publishedAt: {
          lte: now,
        },
      },
      data: {
        status: "published",
      },
    }),
    prisma.photo.updateMany({
      where: {
        status: "scheduled",
        publishedAt: {
          lte: now,
        },
      },
      data: {
        status: "published",
      },
    }),
  ]);

  return {
    publishedArticles: articlesResult.count,
    publishedPhotos: photosResult.count,
    timestamp: now,
  };
}

/**
 * 快取機制：避免每個請求都執行資料庫更新
 * 每 60 秒最多檢查一次
 */
let lastCheck: Date | null = null;
const CHECK_INTERVAL_MS = 60 * 1000; // 60 秒

export async function checkAndPublish(): Promise<PublishResult | null> {
  const now = new Date();

  // 如果距離上次檢查不到 60 秒，跳過
  if (lastCheck && now.getTime() - lastCheck.getTime() < CHECK_INTERVAL_MS) {
    return null;
  }

  lastCheck = now;

  try {
    const result = await publishScheduledContent();

    // 只有真的有發布內容時才記錄
    if (result.publishedArticles > 0 || result.publishedPhotos > 0) {
      console.log(
        `[Auto-publish] Published ${result.publishedArticles} articles, ${result.publishedPhotos} photos at ${result.timestamp.toISOString()}`
      );
    }

    return result;
  } catch (error) {
    console.error("[Auto-publish] Error:", error);
    return null;
  }
}

/**
 * 發布單一內容（用於手動發布）
 */
export async function publishSinglePhoto(id: number) {
  return prisma.photo.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: new Date(),
    },
  });
}

export async function publishSingleArticle(id: number) {
  return prisma.article.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: new Date(),
    },
  });
}

/**
 * 排程發布（設定未來發布時間）
 */
export async function schedulePhoto(id: number, publishAt: Date) {
  return prisma.photo.update({
    where: { id },
    data: {
      status: "scheduled",
      publishedAt: publishAt,
    },
  });
}

export async function scheduleArticle(id: number, publishAt: Date) {
  return prisma.article.update({
    where: { id },
    data: {
      status: "scheduled",
      publishedAt: publishAt,
    },
  });
}

/**
 * 取消排程（改回草稿）
 */
export async function unschedulePhoto(id: number) {
  return prisma.photo.update({
    where: { id },
    data: {
      status: "draft",
      publishedAt: null,
    },
  });
}

export async function unscheduleArticle(id: number) {
  return prisma.article.update({
    where: { id },
    data: {
      status: "draft",
      publishedAt: null,
    },
  });
}
