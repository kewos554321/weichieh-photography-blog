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

// GET /api/photos/[slug] - 取得單張照片
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";

    const photo = await prisma.photo.findUnique({
      where: { slug },
      include: {
        tags: true,
        article: {
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            cover: true,
            status: true,
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // 非管理員只能查看已發佈且發佈時間已到的內容
    if (!admin) {
      const isPublished = photo.status === "published";
      const isScheduleReady =
        !photo.publishedAt || photo.publishedAt <= new Date();
      if (!isPublished || !isScheduleReady) {
        return NextResponse.json({ error: "Photo not found" }, { status: 404 });
      }
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Get photo error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}

// PUT /api/photos/[slug] - 更新照片
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const photo = await prisma.photo.update({
      where: { slug },
      data: {
        title: body.title,
        category: body.category,
        location: body.location,
        ...(body.latitude !== undefined && { latitude: body.latitude }),
        ...(body.longitude !== undefined && { longitude: body.longitude }),
        date: body.date ? new Date(body.date) : undefined,
        camera: body.camera,
        lens: body.lens,
        story: body.story,
        behindTheScene: body.behindTheScene,
        status: body.status,
        publishedAt:
          body.publishedAt !== undefined
            ? body.publishedAt
              ? new Date(body.publishedAt)
              : null
            : undefined,
        ...(body.src && { src: body.src }),
        ...(body.tagIds !== undefined && {
          tags: {
            set: body.tagIds.map((id: number) => ({ id })),
          },
        }),
        ...(body.articleId !== undefined && {
          articleId: body.articleId,
        }),
      },
      include: {
        tags: true,
        article: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Update photo error:", error);
    return NextResponse.json(
      { error: "Failed to update photo" },
      { status: 500 }
    );
  }
}

// DELETE /api/photos/[slug] - 刪除照片
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // 先取得照片資訊以獲取圖片 URL
    const photo = await prisma.photo.findUnique({
      where: { slug },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // 從 URL 提取 R2 key
    const publicUrl = process.env.R2_PUBLIC_URL!;
    if (photo.src.startsWith(publicUrl)) {
      const key = photo.src.replace(publicUrl + "/", "");

      // 刪除 R2 上的檔案
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
    await prisma.photo.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete photo error:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
