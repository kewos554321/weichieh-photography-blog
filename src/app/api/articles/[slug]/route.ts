import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ slug: string }> };

const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// GET /api/articles/[slug] - 取得單篇文章
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";

    const article = await prisma.article.findUnique({
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

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // 非管理員只能查看已發佈且發佈時間已到的內容
    if (!admin) {
      const isPublished = article.status === "published";
      const isScheduleReady =
        !article.publishedAt || article.publishedAt <= new Date();
      if (!isPublished || !isScheduleReady) {
        return NextResponse.json(
          { error: "Article not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Get article error:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

// PUT /api/articles/[slug] - 更新文章
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // 重新計算閱讀時間
    const readTime = body.content
      ? Math.ceil(body.content.length / 300)
      : undefined;

    const article = await prisma.article.update({
      where: { slug },
      data: {
        title: body.title,
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

    return NextResponse.json(article);
  } catch (error) {
    console.error("Update article error:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/[slug] - 刪除文章
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // 先取得文章資訊以獲取封面圖片 URL
    const article = await prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // 從 URL 提取 R2 key
    const publicUrl = process.env.R2_PUBLIC_URL!;
    if (article.cover.startsWith(publicUrl)) {
      const key = article.cover.replace(publicUrl + "/", "");

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
    await prisma.article.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete article error:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
