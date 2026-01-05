import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/admin/tokens/[id]/permissions - 更新授權內容
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { photoIds, albumIds } = body;

    // 確認 token 存在
    const token = await prisma.accessToken.findUnique({
      where: { id },
    });

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // 使用 transaction 更新權限
    await prisma.$transaction(async (tx) => {
      // 更新照片權限
      if (Array.isArray(photoIds)) {
        // 刪除所有現有的照片權限
        await tx.accessTokenPhoto.deleteMany({
          where: { accessTokenId: id },
        });

        // 新增新的照片權限
        if (photoIds.length > 0) {
          await tx.accessTokenPhoto.createMany({
            data: photoIds.map((photoId: number) => ({
              accessTokenId: id,
              photoId,
            })),
          });
        }
      }

      // 更新相簿權限
      if (Array.isArray(albumIds)) {
        // 刪除所有現有的相簿權限
        await tx.accessTokenAlbum.deleteMany({
          where: { accessTokenId: id },
        });

        // 新增新的相簿權限
        if (albumIds.length > 0) {
          await tx.accessTokenAlbum.createMany({
            data: albumIds.map((albumId: number) => ({
              accessTokenId: id,
              albumId,
            })),
          });
        }
      }
    });

    // 回傳更新後的 token
    const updatedToken = await prisma.accessToken.findUnique({
      where: { id },
      include: {
        photos: {
          include: {
            photo: {
              select: {
                id: true,
                slug: true,
                title: true,
                src: true,
              },
            },
          },
        },
        albums: {
          include: {
            album: {
              select: {
                id: true,
                slug: true,
                name: true,
                coverUrl: true,
              },
            },
          },
        },
      },
    });

    const response = {
      ...updatedToken,
      authorizedPhotos: updatedToken?.photos.map((p) => p.photo) || [],
      authorizedAlbums: updatedToken?.albums.map((a) => a.album) || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Update token permissions error:", error);
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    );
  }
}
