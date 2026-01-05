import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateUniqueAlbumSlug } from "@/lib/slug";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/albums/[slug] - 取得單一相簿詳情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";

    // 取得訪客 token
    const visitorToken = request.cookies.get("visitor_token")?.value;

    const album = await prisma.album.findUnique({
      where: { slug },
      include: {
        photos: {
          include: {
            photo: {
              include: {
                tags: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // 管理員可以看到所有內容
    if (admin) {
      const photos = album.photos.map((ap) => ap.photo);
      return NextResponse.json({ ...album, photos });
    }

    // 根據 visibility 檢查存取權限
    let hasAccess = false;

    if (album.visibility === "public") {
      hasAccess = true;
    } else if (album.visibility === "private") {
      // 檢查訪客 token 是否有權限
      if (visitorToken) {
        const accessToken = await prisma.accessToken.findUnique({
          where: { token: visitorToken },
          include: {
            albums: { where: { albumId: album.id } },
          },
        });

        if (
          accessToken?.isActive &&
          accessToken.albums.length > 0 &&
          (!accessToken.expiresAt || accessToken.expiresAt > new Date())
        ) {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // 過濾未發布的照片（非管理員）
    const photos = album.photos
      .filter((ap) => ap.photo.status === "published")
      .map((ap) => ap.photo);

    return NextResponse.json({
      ...album,
      photos,
    });
  } catch (error) {
    console.error("Get album error:", error);
    return NextResponse.json(
      { error: "Failed to fetch album" },
      { status: 500 }
    );
  }
}

// PUT /api/albums/[slug] - 更新相簿
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const album = await prisma.album.findUnique({
      where: { slug },
      select: { name: true },
    });
    if (!album) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // 如果 name 有變更，重新產生 slug
    let newSlug: string | undefined;
    if (body.name && body.name !== album.name) {
      newSlug = await generateUniqueAlbumSlug(body.name, slug);
    }

    const updated = await prisma.album.update({
      where: { slug },
      data: {
        name: body.name,
        ...(newSlug && { slug: newSlug }),
        description: body.description !== undefined ? body.description : undefined,
        coverUrl: body.coverUrl !== undefined ? body.coverUrl : undefined,
        sortOrder: body.sortOrder,
        // 隱私控制欄位（簡化版）
        ...(body.visibility !== undefined && { visibility: body.visibility }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update album error:", error);
    return NextResponse.json(
      { error: "Failed to update album" },
      { status: 500 }
    );
  }
}

// DELETE /api/albums/[slug] - 刪除相簿
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const album = await prisma.album.findUnique({ where: { slug } });
    if (!album) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // 刪除相簿（照片關聯會因為 onDelete: Cascade 自動刪除）
    await prisma.album.delete({ where: { slug } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete album error:", error);
    return NextResponse.json(
      { error: "Failed to delete album" },
      { status: 500 }
    );
  }
}
