import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/analytics - 取得統計數據
export async function GET() {
  try {
    // Get total counts
    const [totalPhotos, totalPosts, publishedPhotos, publishedPosts] = await Promise.all([
      prisma.photo.count(),
      prisma.post.count(),
      prisma.photo.count({ where: { status: "published" } }),
      prisma.post.count({ where: { status: "published" } }),
    ]);

    // Get total views
    const [photoViews, postViews] = await Promise.all([
      prisma.photo.aggregate({ _sum: { viewCount: true } }),
      prisma.post.aggregate({ _sum: { viewCount: true } }),
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
    const topPosts = await prisma.post.findMany({
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
    const postCategoryStats = await prisma.post.groupBy({
      by: ["category"],
      where: { status: "published" },
      _count: { id: true },
      _sum: { viewCount: true },
    });

    // Get recent content (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentPhotos, recentPosts] = await Promise.all([
      prisma.photo.count({
        where: {
          status: "published",
          publishedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.post.count({
        where: {
          status: "published",
          publishedAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    // Get draft counts
    const [draftPhotos, draftPosts] = await Promise.all([
      prisma.photo.count({ where: { status: "draft" } }),
      prisma.post.count({ where: { status: "draft" } }),
    ]);

    return NextResponse.json({
      overview: {
        totalPhotos,
        totalPosts,
        publishedPhotos,
        publishedPosts,
        draftPhotos,
        draftPosts,
        totalViews: (photoViews._sum.viewCount || 0) + (postViews._sum.viewCount || 0),
        photoViews: photoViews._sum.viewCount || 0,
        postViews: postViews._sum.viewCount || 0,
        recentPhotos,
        recentPosts,
      },
      topPhotos,
      topPosts,
      photoCategoryStats: photoCategoryStats.map((s) => ({
        category: s.category,
        count: s._count.id,
        views: s._sum.viewCount || 0,
      })),
      postCategoryStats: postCategoryStats.map((s) => ({
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
