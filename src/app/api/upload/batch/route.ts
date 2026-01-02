import { NextRequest, NextResponse } from "next/server";
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

interface FileInfo {
  filename: string;
  contentType: string;
}

interface UploadResult {
  filename: string;
  presignedUrl: string;
  publicUrl: string;
  key: string;
}

// POST /api/upload/batch - 批次產生上傳 URL
export async function POST(request: NextRequest) {
  try {
    const { files, folder = "photos" } = await request.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty files array" },
        { status: 400 }
      );
    }

    // 限制單次批次上傳數量
    const MAX_BATCH_SIZE = 20;
    if (files.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Batch size exceeds limit of ${MAX_BATCH_SIZE} files` },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const timestamp = Date.now();

    // 並行產生所有 presigned URLs
    const uploadPromises = files.map(async (file: FileInfo, index: number) => {
      const { filename, contentType } = file;

      if (!filename || !contentType) {
        throw new Error(`Invalid file info at index ${index}`);
      }

      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "-");
      const key = `${folder}/${year}/${month}/${timestamp}-${index}-${sanitizedFilename}`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      return {
        filename,
        presignedUrl,
        publicUrl,
        key,
      } as UploadResult;
    });

    const results = await Promise.all(uploadPromises);

    return NextResponse.json({
      success: true,
      count: results.length,
      uploads: results,
    });
  } catch (error) {
    console.error("Batch upload error:", error);
    return NextResponse.json(
      { error: "Failed to generate batch upload URLs" },
      { status: 500 }
    );
  }
}
