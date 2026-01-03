import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// POST /api/media/[id]/edit - 儲存編輯後的圖片
export async function POST(
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

    const originalMedia = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { tags: true },
    });

    if (!originalMedia) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const { saveAsNew, newFilename, contentType, size, width, height } = body;

    // 產生新的 key
    const timestamp = Date.now();
    const filename = newFilename || `edited-${originalMedia.filename}`;
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "-");
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const key = `media/${year}/${month}/${timestamp}-${sanitizedFilename}`;

    // 產生 presigned URL 給客戶端上傳編輯後的圖片
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType || originalMedia.mimeType,
    });

    const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    if (saveAsNew) {
      // 建立新的 Media 記錄
      const newMedia = await prisma.media.create({
        data: {
          filename: sanitizedFilename,
          url: publicUrl,
          key,
          mimeType: contentType || originalMedia.mimeType,
          size: size || originalMedia.size,
          width: width || originalMedia.width,
          height: height || originalMedia.height,
          alt: originalMedia.alt,
          tags: {
            connect: originalMedia.tags.map((tag) => ({ id: tag.id })),
          },
        },
        include: { tags: true },
      });

      return NextResponse.json({
        presignedUrl,
        publicUrl,
        key,
        media: newMedia,
        isNew: true,
      }, { status: 201 });
    } else {
      // 更新現有的 Media 記錄 (覆蓋)
      // 注意：舊的 R2 檔案不會被刪除，可以之後實作清理機制
      const updatedMedia = await prisma.media.update({
        where: { id: mediaId },
        data: {
          filename: sanitizedFilename,
          url: publicUrl,
          key,
          mimeType: contentType || originalMedia.mimeType,
          size: size || originalMedia.size,
          width: width || originalMedia.width,
          height: height || originalMedia.height,
        },
        include: { tags: true },
      });

      return NextResponse.json({
        presignedUrl,
        publicUrl,
        key,
        media: updatedMedia,
        isNew: false,
      });
    }
  } catch (error) {
    console.error("Edit media error:", error);
    return NextResponse.json(
      { error: "Failed to save edited media" },
      { status: 500 }
    );
  }
}
