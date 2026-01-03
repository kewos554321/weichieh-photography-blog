import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// POST /api/albums/[slug]/photos - 新增照片到相簿
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { photoIds } = body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: "photoIds array is required" },
        { status: 400 }
      );
    }

    const album = await prisma.album.findUnique({ where: { slug } });
    if (!album) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // 取得目前最大的 sortOrder
    const maxSort = await prisma.albumPhoto.aggregate({
      where: { albumId: album.id },
      _max: { sortOrder: true },
    });
    let nextSort = (maxSort._max.sortOrder || 0) + 1;

    // 過濾已存在的關聯
    const existingRelations = await prisma.albumPhoto.findMany({
      where: {
        albumId: album.id,
        photoId: { in: photoIds },
      },
      select: { photoId: true },
    });
    const existingPhotoIds = new Set(existingRelations.map((r) => r.photoId));
    const newPhotoIds = photoIds.filter((id: number) => !existingPhotoIds.has(id));

    if (newPhotoIds.length === 0) {
      return NextResponse.json({ added: 0, message: "All photos already in album" });
    }

    // 批量新增
    await prisma.albumPhoto.createMany({
      data: newPhotoIds.map((photoId: number) => ({
        albumId: album.id,
        photoId,
        sortOrder: nextSort++,
      })),
    });

    // 如果相簿沒有封面，自動設定第一張照片為封面
    if (!album.coverUrl) {
      const firstPhoto = await prisma.photo.findUnique({
        where: { id: newPhotoIds[0] },
      });
      if (firstPhoto) {
        await prisma.album.update({
          where: { id: album.id },
          data: { coverUrl: firstPhoto.src },
        });
      }
    }

    return NextResponse.json({
      added: newPhotoIds.length,
      skipped: photoIds.length - newPhotoIds.length,
    });
  } catch (error) {
    console.error("Add photos to album error:", error);
    return NextResponse.json(
      { error: "Failed to add photos" },
      { status: 500 }
    );
  }
}

// DELETE /api/albums/[slug]/photos - 從相簿移除照片
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { photoIds } = body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: "photoIds array is required" },
        { status: 400 }
      );
    }

    const album = await prisma.album.findUnique({ where: { slug } });
    if (!album) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    const result = await prisma.albumPhoto.deleteMany({
      where: {
        albumId: album.id,
        photoId: { in: photoIds },
      },
    });

    return NextResponse.json({ removed: result.count });
  } catch (error) {
    console.error("Remove photos from album error:", error);
    return NextResponse.json(
      { error: "Failed to remove photos" },
      { status: 500 }
    );
  }
}

// PUT /api/albums/[slug]/photos - 更新照片排序
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { photoIds } = body; // 按順序排列的 photoId 陣列

    if (!Array.isArray(photoIds)) {
      return NextResponse.json(
        { error: "photoIds array is required" },
        { status: 400 }
      );
    }

    const album = await prisma.album.findUnique({ where: { slug } });
    if (!album) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // 批量更新排序
    await Promise.all(
      photoIds.map((photoId: number, index: number) =>
        prisma.albumPhoto.updateMany({
          where: {
            albumId: album.id,
            photoId,
          },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder album photos error:", error);
    return NextResponse.json(
      { error: "Failed to reorder photos" },
      { status: 500 }
    );
  }
}
