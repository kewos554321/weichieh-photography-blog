import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processAndUploadImage } from "@/lib/imageProcessor";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 60; // 最長 60 秒

// POST /api/media/upload - 上傳並處理圖片
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const alt = formData.get("alt") as string | null;
    const folderId = formData.get("folderId") as string | null;
    const tagIds = formData.get("tagIds") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 驗證檔案類型
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // 驗證檔案大小 (最大 20MB 原圖)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB" },
        { status: 400 }
      );
    }

    // 讀取檔案為 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 產生唯一的 key
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const baseKey = `media/${year}/${month}/${timestamp}-${sanitizedFilename}`;

    // 處理圖片並上傳多種尺寸
    const result = await processAndUploadImage(buffer, baseKey, file.name);

    // 建立 Media 記錄
    const media = await prisma.media.create({
      data: {
        filename: sanitizedFilename.replace(/\.[^.]+$/, ".webp"),
        url: result.variants.original,
        key: baseKey.replace(/\.[^.]+$/, ".webp"),
        mimeType: "image/webp",
        size: result.size,
        width: result.width,
        height: result.height,
        alt: alt || null,
        variants: result.variants as unknown as Prisma.InputJsonValue,
        ...(tagIds && {
          tags: {
            connect: JSON.parse(tagIds).map((id: number) => ({ id })),
          },
        }),
        ...(folderId && { folderId: parseInt(folderId) }),
      },
      include: {
        tags: true,
        folder: true,
      },
    });

    return NextResponse.json(
      {
        id: media.id,
        url: media.url,
        variants: result.variants,
        width: result.width,
        height: result.height,
        media,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload and process error:", error);
    return NextResponse.json(
      { error: "Failed to process and upload image" },
      { status: 500 }
    );
  }
}
