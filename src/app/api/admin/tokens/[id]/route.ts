import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/admin/tokens/[id] - 取得單一 Token 及其授權內容
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const token = await prisma.accessToken.findUnique({
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

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // 轉換格式，方便前端使用
    const response = {
      ...token,
      authorizedPhotos: token.photos.map((p) => p.photo),
      authorizedAlbums: token.albums.map((a) => a.album),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get token error:", error);
    return NextResponse.json(
      { error: "Failed to get token" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/tokens/[id] - 更新 Token
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, expiresAt, isActive } = body;

    const token = await prisma.accessToken.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(expiresAt !== undefined && {
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: {
          select: {
            photos: true,
            albums: true,
          },
        },
      },
    });

    return NextResponse.json(token);
  } catch (error) {
    console.error("Update token error:", error);
    return NextResponse.json(
      { error: "Failed to update token" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tokens/[id] - 刪除 Token
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.accessToken.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete token error:", error);
    return NextResponse.json(
      { error: "Failed to delete token" },
      { status: 500 }
    );
  }
}
