import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/analytics - 取得統計數據
export async function GET() {
  try {
    // Get total counts
    const [totalPhotos, totalArticles, publishedPhotos, publishedArticles] = await Promise.all([
      prisma.photo.count(),
      prisma.article.count(),
      prisma.photo.count({ where: { status: "published" } }),
      prisma.article.count({ where: { status: "published" } }),
    ]);

    // Get total views
    const [photoViews, articleViews] = await Promise.all([
      prisma.photo.aggregate({ _sum: { viewCount: true } }),
      prisma.article.aggregate({ _sum: { viewCount: true } }),
    ]);

    // Get top photos by views
    const topPhotos = await prisma.photo.findMany({
      where: { status: "published" },
      orderBy: { viewCount: "desc" },
      take: 10,
      select: {
        id: true,
        slug: true,
        title: true,
        src: true,
        viewCount: true,
        category: true,
      },
    });

    // Get top articles by views
    const topArticles = await prisma.article.findMany({
      where: { status: "published" },
      orderBy: { viewCount: "desc" },
      take: 10,
      select: {
        id: true,
        slug: true,
        title: true,
        cover: true,
        viewCount: true,
        category: true,
      },
    });

    // Get category breakdown for photos
    const photoCategoryStats = await prisma.photo.groupBy({
      by: ["category"],
      where: { status: "published" },
      _count: { id: true },
      _sum: { viewCount: true },
    });

    // Get category breakdown for articles
    const articleCategoryStats = await prisma.article.groupBy({
      by: ["category"],
      where: { status: "published" },
      _count: { id: true },
      _sum: { viewCount: true },
    });

    // Get recent content (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentPhotos, recentArticles] = await Promise.all([
      prisma.photo.count({
        where: {
          status: "published",
          publishedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.article.count({
        where: {
          status: "published",
          publishedAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    // Get draft counts
    const [draftPhotos, draftArticles] = await Promise.all([
      prisma.photo.count({ where: { status: "draft" } }),
      prisma.article.count({ where: { status: "draft" } }),
    ]);

    return NextResponse.json({
      overview: {
        totalPhotos,
        totalArticles,
        publishedPhotos,
        publishedArticles,
        draftPhotos,
        draftArticles,
        totalViews: (photoViews._sum.viewCount || 0) + (articleViews._sum.viewCount || 0),
        photoViews: photoViews._sum.viewCount || 0,
        articleViews: articleViews._sum.viewCount || 0,
        recentPhotos,
        recentArticles,
      },
      topPhotos,
      topArticles,
      photoCategoryStats: photoCategoryStats.map((s) => ({
        category: s.category,
        count: s._count.id,
        views: s._sum.viewCount || 0,
      })),
      articleCategoryStats: articleCategoryStats.map((s) => ({
        category: s.category,
        count: s._count.id,
        views: s._sum.viewCount || 0,
      })),
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { error: "Failed to get analytics" },
      { status: 500 }
    );
  }
}
