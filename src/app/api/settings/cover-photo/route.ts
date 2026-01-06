import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface CoverPhotoSettings {
  photoId: number | null;
  photoSlug: string | null;
  photoSrc: string | null;
  photoTitle: string | null;
}

const DEFAULT_COVER: CoverPhotoSettings = {
  photoId: null,
  photoSlug: null,
  photoSrc: null,
  photoTitle: null,
};

// GET /api/settings/cover-photo - 取得首頁 Cover 照片設定
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: "cover-photo" },
    });

    if (!settings) {
      return NextResponse.json(DEFAULT_COVER);
    }

    const coverSettings = settings.value as unknown as CoverPhotoSettings;

    // 如果有設定 photoId，確認照片仍存在
    if (coverSettings.photoId) {
      const photo = await prisma.photo.findUnique({
        where: { id: coverSettings.photoId },
        select: { id: true, slug: true, src: true, title: true, status: true },
      });

      if (!photo || photo.status !== "published") {
        // 照片已被刪除或不再是發布狀態，返回預設值
        return NextResponse.json(DEFAULT_COVER);
      }

      // 返回最新的照片資訊
      return NextResponse.json({
        photoId: photo.id,
        photoSlug: photo.slug,
        photoSrc: photo.src,
        photoTitle: photo.title,
      });
    }

    return NextResponse.json(coverSettings);
  } catch (error) {
    console.error("Get cover photo settings error:", error);
    return NextResponse.json(
      { error: "Failed to get cover photo settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/cover-photo - 設定首頁 Cover 照片
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    // 如果傳入 photoId，驗證照片存在
    if (data.photoId) {
      const photo = await prisma.photo.findUnique({
        where: { id: data.photoId },
        select: { id: true, slug: true, src: true, title: true },
      });

      if (!photo) {
        return NextResponse.json(
          { error: "Photo not found" },
          { status: 404 }
        );
      }

      const coverSettings: CoverPhotoSettings = {
        photoId: photo.id,
        photoSlug: photo.slug,
        photoSrc: photo.src,
        photoTitle: photo.title,
      };

      await prisma.siteSettings.upsert({
        where: { key: "cover-photo" },
        update: { value: coverSettings as unknown as Prisma.InputJsonValue },
        create: { key: "cover-photo", value: coverSettings as unknown as Prisma.InputJsonValue },
      });

      return NextResponse.json(coverSettings);
    }

    // 清除 cover photo 設定
    const coverSettings = DEFAULT_COVER;
    await prisma.siteSettings.upsert({
      where: { key: "cover-photo" },
      update: { value: coverSettings as unknown as Prisma.InputJsonValue },
      create: { key: "cover-photo", value: coverSettings as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json(coverSettings);
  } catch (error) {
    console.error("Update cover photo settings error:", error);
    return NextResponse.json(
      { error: "Failed to update cover photo settings" },
      { status: 500 }
    );
  }
}
