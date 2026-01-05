import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { generateUniquePhotoSlug } from "@/lib/slug";

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

    // 取得訪客 token
    const visitorToken = request.cookies.get("visitor_token")?.value;

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
        albums: {
          include: {
            album: {
              select: {
                id: true,
                slug: true,
                name: true,
                isPublic: true,
              },
            },
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // 管理員可以看到所有內容
    if (admin) {
      return NextResponse.json(photo);
    }

    // 非管理員只能查看已發佈且發佈時間已到的內容
    const isPublished = photo.status === "published";
    const isScheduleReady =
      !photo.publishedAt || photo.publishedAt <= new Date();
    if (!isPublished || !isScheduleReady) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // 根據 visibility 檢查存取權限
    if (photo.visibility === "public") {
      return NextResponse.json(photo);
    }

    if (photo.visibility === "private") {
      // 檢查訪客 token 是否有權限
      if (visitorToken) {
        const accessToken = await prisma.accessToken.findUnique({
          where: { token: visitorToken },
          include: {
            photos: { where: { photoId: photo.id } },
          },
        });

        if (
          accessToken?.isActive &&
          accessToken.photos.length > 0 &&
          (!accessToken.expiresAt || accessToken.expiresAt > new Date())
        ) {
          return NextResponse.json(photo);
        }
      }

      // 沒有權限
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
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

    // 取得目前的照片
    const currentPhoto = await prisma.photo.findUnique({
      where: { slug },
      select: { title: true },
    });

    if (!currentPhoto) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // 如果 title 有變更，重新產生 slug
    let newSlug: string | undefined;
    if (body.title && body.title !== currentPhoto.title) {
      newSlug = await generateUniquePhotoSlug(body.title, slug);
    }

    const photo = await prisma.photo.update({
      where: { slug },
      data: {
        title: body.title,
        ...(newSlug && { slug: newSlug }),
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
        // 隱私控制欄位（簡化版）
        ...(body.visibility !== undefined && { visibility: body.visibility }),
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
