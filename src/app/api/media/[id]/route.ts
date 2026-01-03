import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// GET /api/media/[id] - 取得單一媒體 + 使用狀況
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mediaId = parseInt(id);

    if (isNaN(mediaId)) {
      return NextResponse.json({ error: "Invalid media ID" }, { status: 400 });
    }

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { tags: true },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // 查詢使用狀況
    const [photos, articles] = await Promise.all([
      prisma.photo.findMany({
        where: { src: { contains: media.url } },
        select: { id: true, slug: true, title: true },
      }),
      prisma.article.findMany({
        where: {
          OR: [
            { cover: { contains: media.url } },
            { content: { contains: media.url } },
          ],
        },
        select: { id: true, slug: true, title: true },
      }),
    ]);

    return NextResponse.json({
      ...media,
      usage: { photos, articles },
    });
  } catch (error) {
    console.error("Get media error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// PUT /api/media/[id] - 更新媒體 metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mediaId = parseInt(id);
    const body = await request.json();

    if (isNaN(mediaId)) {
      return NextResponse.json({ error: "Invalid media ID" }, { status: 400 });
    }

    const existing = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const { alt, tagIds } = body;

    const media = await prisma.media.update({
      where: { id: mediaId },
      data: {
        ...(alt !== undefined && { alt }),
        ...(tagIds && {
          tags: {
            set: tagIds.map((tagId: number) => ({ id: tagId })),
          },
        }),
      },
      include: { tags: true },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error("Update media error:", error);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}

// DELETE /api/media/[id] - 刪除媒體
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mediaId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    if (isNaN(mediaId)) {
      return NextResponse.json({ error: "Invalid media ID" }, { status: 400 });
    }

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // 檢查使用狀況
    const [photos, articles] = await Promise.all([
      prisma.photo.findMany({
        where: { src: { contains: media.url } },
        select: { id: true, slug: true, title: true },
      }),
      prisma.article.findMany({
        where: {
          OR: [
            { cover: { contains: media.url } },
            { content: { contains: media.url } },
          ],
        },
        select: { id: true, slug: true, title: true },
      }),
    ]);

    const isInUse = photos.length > 0 || articles.length > 0;

    if (isInUse && !force) {
      return NextResponse.json(
        {
          error: "Media is in use",
          usage: { photos, articles },
        },
        { status: 409 }
      );
    }

    // 從 R2 刪除檔案
    try {
      await S3.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: media.key,
        })
      );
    } catch (r2Error) {
      console.error("Failed to delete R2 object:", r2Error);
      // 繼續刪除資料庫記錄，即使 R2 刪除失敗
    }

    // 刪除資料庫記錄
    await prisma.media.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete media error:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
