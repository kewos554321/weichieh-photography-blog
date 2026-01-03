import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/albums/[slug] - 取得單一相簿詳情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";

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

    // 非管理員不能看私人相簿
    if (!admin && !album.isPublic) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // 過濾未發布的照片（非管理員）
    const photos = admin
      ? album.photos.map((ap) => ap.photo)
      : album.photos
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

    const album = await prisma.album.findUnique({ where: { slug } });
    if (!album) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // 如果要更新 slug，檢查新 slug 是否已存在
    if (body.slug && body.slug !== slug) {
      const existing = await prisma.album.findUnique({
        where: { slug: body.slug },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.album.update({
      where: { slug },
      data: {
        name: body.name ?? album.name,
        slug: body.slug ?? album.slug,
        description: body.description !== undefined ? body.description : album.description,
        coverUrl: body.coverUrl !== undefined ? body.coverUrl : album.coverUrl,
        isPublic: body.isPublic !== undefined ? body.isPublic : album.isPublic,
        sortOrder: body.sortOrder ?? album.sortOrder,
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
