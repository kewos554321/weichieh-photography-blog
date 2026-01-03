import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/albums - 取得相簿列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";

    const where = admin ? {} : { isPublic: true };

    const albums = await prisma.album.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        photos: {
          include: {
            photo: {
              select: {
                id: true,
                slug: true,
                src: true,
                title: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
          take: 4, // 預覽用只取前 4 張
        },
        _count: {
          select: { photos: true },
        },
      },
    });

    // 轉換格式
    const result = albums.map((album) => ({
      ...album,
      photoCount: album._count.photos,
      previewPhotos: album.photos.map((ap) => ap.photo),
      photos: undefined,
      _count: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get albums error:", error);
    return NextResponse.json(
      { error: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}

// POST /api/albums - 新增相簿
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, coverUrl, isPublic } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // 檢查 slug 是否已存在
    const existing = await prisma.album.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }

    // 取得最大 sortOrder
    const maxSort = await prisma.album.aggregate({
      _max: { sortOrder: true },
    });

    const album = await prisma.album.create({
      data: {
        name,
        slug,
        description: description || null,
        coverUrl: coverUrl || null,
        isPublic: isPublic !== false,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json(album, { status: 201 });
  } catch (error) {
    console.error("Create album error:", error);
    return NextResponse.json(
      { error: "Failed to create album" },
      { status: 500 }
    );
  }
}
