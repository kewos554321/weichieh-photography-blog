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

// GET /api/media - 取得媒體列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24");
    const search = searchParams.get("search");
    const tags = searchParams.get("tags");
    const mimeType = searchParams.get("mimeType");
    const folderId = searchParams.get("folderId");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: "insensitive" } },
        { alt: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tags) {
      const tagNames = tags.split(",").map((t) => t.trim());
      where.tags = { some: { name: { in: tagNames } } };
    }

    if (mimeType) {
      where.mimeType = { startsWith: mimeType };
    }

    if (folderId) {
      if (folderId === "none") {
        where.folderId = null;
      } else {
        where.folderId = parseInt(folderId);
      }
    }

    const skip = (page - 1) * limit;

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip,
        include: {
          tags: true,
          folder: true,
        },
      }),
      prisma.media.count({ where }),
    ]);

    return NextResponse.json({
      media,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get media error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// POST /api/media - 上傳新媒體
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType, size, width, height, alt, tagIds, folderId } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Missing filename or contentType" },
        { status: 400 }
      );
    }

    // 產生唯一的檔名和 key
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "-");
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const key = `media/${year}/${month}/${timestamp}-${sanitizedFilename}`;

    // 產生 presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    // 建立 Media 記錄
    const media = await prisma.media.create({
      data: {
        filename: sanitizedFilename,
        url: publicUrl,
        key,
        mimeType: contentType,
        size: size || 0,
        width: width || null,
        height: height || null,
        alt: alt || null,
        ...(tagIds && {
          tags: {
            connect: tagIds.map((id: number) => ({ id })),
          },
        }),
        ...(folderId && { folderId }),
      },
      include: {
        tags: true,
        folder: true,
      },
    });

    return NextResponse.json({
      id: media.id,
      presignedUrl,
      publicUrl,
      key,
      media,
    }, { status: 201 });
  } catch (error) {
    console.error("Upload media error:", error);
    return NextResponse.json(
      { error: "Failed to create media" },
      { status: 500 }
    );
  }
}
