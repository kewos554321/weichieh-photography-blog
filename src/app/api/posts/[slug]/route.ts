import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { generateUniquePostSlug } from "@/lib/slug";

type RouteParams = { params: Promise<{ slug: string }> };

const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// GET /api/posts/[slug] - 取得單篇文章
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";
    const includeContext = searchParams.get("context") === "true";

    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        tags: true,
        photos: {
          where: admin ? {} : { status: "published" },
          select: {
            id: true,
            slug: true,
            title: true,
            src: true,
            location: true,
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 非管理員只能查看已發佈且發佈時間已到的內容
    if (!admin) {
      const isPublished = post.status === "published";
      const isScheduleReady =
        !post.publishedAt || post.publishedAt <= new Date();
      if (!isPublished || !isScheduleReady) {
        return NextResponse.json(
          { error: "Post not found" },
          { status: 404 }
        );
      }
    }

    // If context is requested, fetch related articles and navigation
    if (includeContext && !admin) {
      const baseWhere = {
        status: "published" as const,
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      };

      // Fetch related articles (same category, exclude current, limit 2)
      const relatedPosts = await prisma.post.findMany({
        where: {
          ...baseWhere,
          category: post.category,
          slug: { not: slug },
        },
        select: {
          slug: true,
          title: true,
          cover: true,
          category: true,
          readTime: true,
        },
        orderBy: { date: "desc" },
        take: 2,
      });

      // Fetch prev/next articles for navigation (by date order)
      const [prevPost, nextPost] = await Promise.all([
        prisma.post.findFirst({
          where: {
            ...baseWhere,
            date: { lt: post.date },
          },
          select: { slug: true, title: true },
          orderBy: { date: "desc" },
        }),
        prisma.post.findFirst({
          where: {
            ...baseWhere,
            date: { gt: post.date },
          },
          select: { slug: true, title: true },
          orderBy: { date: "asc" },
        }),
      ]);

      return NextResponse.json({
        ...post,
        related: relatedPosts,
        navigation: { prev: prevPost, next: nextPost },
      });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[slug] - 更新文章
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // 取得目前的文章
    const currentPost = await prisma.post.findUnique({
      where: { slug },
      select: { title: true },
    });

    if (!currentPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 如果 title 有變更，重新產生 slug
    let newSlug: string | undefined;
    if (body.title && body.title !== currentPost.title) {
      newSlug = await generateUniquePostSlug(body.title, slug);
    }

    // 重新計算閱讀時間
    const readTime = body.content
      ? Math.ceil(body.content.length / 300)
      : undefined;

    const post = await prisma.post.update({
      where: { slug },
      data: {
        title: body.title,
        ...(newSlug && { slug: newSlug }),
        excerpt: body.excerpt,
        content: body.content,
        category: body.category,
        date: body.date ? new Date(body.date) : undefined,
        status: body.status,
        publishedAt:
          body.publishedAt !== undefined
            ? body.publishedAt
              ? new Date(body.publishedAt)
              : null
            : undefined,
        ...(readTime && { readTime }),
        ...(body.cover && { cover: body.cover }),
        ...(body.tagIds !== undefined && {
          tags: {
            set: body.tagIds.map((id: number) => ({ id })),
          },
        }),
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[slug] - 刪除文章
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // 先取得文章資訊以獲取封面圖片 URL
    const post = await prisma.post.findUnique({
      where: { slug },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 從 URL 提取 R2 key
    const publicUrl = process.env.R2_PUBLIC_URL!;
    if (post.cover.startsWith(publicUrl)) {
      const key = post.cover.replace(publicUrl + "/", "");

      // 刪除 R2 上的封面圖片
      try {
        await S3.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
          })
        );
      } catch (r2Error) {
        console.error("Failed to delete R2 object:", r2Error);
        // 繼續刪除資料庫記錄，即使 R2 刪除失敗
      }
    }

    // 刪除資料庫記錄
    await prisma.post.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
