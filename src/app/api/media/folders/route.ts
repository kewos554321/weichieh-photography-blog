import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/media/folders - 取得資料夾列表
// ?parentId=null - 取得根目錄的資料夾
// ?parentId=123 - 取得指定資料夾的子資料夾
// ?all=true - 取得所有資料夾（扁平列表，用於下拉選單）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentIdParam = searchParams.get("parentId");
    const all = searchParams.get("all") === "true";

    // 取得所有資料夾（扁平列表）
    if (all) {
      const folders = await prisma.mediaFolder.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          _count: {
            select: { media: true, children: true },
          },
          parent: {
            select: { id: true, name: true },
          },
        },
      });
      return NextResponse.json(folders);
    }

    // 取得特定層級的資料夾
    const parentId = parentIdParam === "null" || parentIdParam === ""
      ? null
      : parentIdParam
        ? parseInt(parentIdParam)
        : null;

    const folders = await prisma.mediaFolder.findMany({
      where: { parentId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { media: true, children: true },
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
    const { name, slug, sortOrder, parentId } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // 驗證 parentId 存在（如果有提供）
    if (parentId) {
      const parentFolder = await prisma.mediaFolder.findUnique({
        where: { id: parentId },
      });
      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 }
        );
      }
    }

    // 自動生成 slug（加入時間戳確保唯一）
    const baseSlug = slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();

    const timestamp = Date.now().toString(36);
    const folderSlug = `${baseSlug}-${timestamp}`;

    const folder = await prisma.mediaFolder.create({
      data: {
        name: name.trim(),
        slug: folderSlug,
        sortOrder: sortOrder ?? 0,
        parentId: parentId || null,
      },
      include: {
        _count: {
          select: { media: true, children: true },
        },
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("Create media folder error:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Folder with this name already exists in this location" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create media folder" },
      { status: 500 }
    );
  }
}
