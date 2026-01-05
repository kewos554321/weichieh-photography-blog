import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/media/folders - 取得所有 Media Folders
export async function GET() {
  try {
    const folders = await prisma.mediaFolder.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { media: true },
        },
      },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("Get media folders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media folders" },
      { status: 500 }
    );
  }
}

// POST /api/media/folders - 新增 Media Folder
export async function POST(request: NextRequest) {
  try {
    const { name, slug, sortOrder } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // 自動生成 slug（如果沒有提供）
    const folderSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();

    const folder = await prisma.mediaFolder.create({
      data: {
        name: name.trim(),
        slug: folderSlug,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("Create media folder error:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Folder already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create media folder" },
      { status: 500 }
    );
  }
}
