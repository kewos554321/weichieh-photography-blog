import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 遞迴取得資料夾路徑（用於 breadcrumb）
async function getFolderPath(folderId: number): Promise<{ id: number; name: string }[]> {
  const folder = await prisma.mediaFolder.findUnique({
    where: { id: folderId },
    select: { id: true, name: true, parentId: true },
  });

  if (!folder) return [];

  if (folder.parentId) {
    const parentPath = await getFolderPath(folder.parentId);
    return [...parentPath, { id: folder.id, name: folder.name }];
  }

  return [{ id: folder.id, name: folder.name }];
}

// GET /api/media/folders/[id] - 取得單一資料夾詳情（含路徑）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const folderId = parseInt(id);

    if (isNaN(folderId)) {
      return NextResponse.json(
        { error: "Invalid folder ID" },
        { status: 400 }
      );
    }

    const folder = await prisma.mediaFolder.findUnique({
      where: { id: folderId },
      include: {
        _count: {
          select: { media: true, children: true },
        },
        children: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: {
              select: { media: true, children: true },
            },
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    // 取得路徑
    const path = await getFolderPath(folderId);

    return NextResponse.json({
      ...folder,
      path,
    });
  } catch (error) {
    console.error("Get media folder error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media folder" },
      { status: 500 }
    );
  }
}

// PUT /api/media/folders/[id] - 更新 Media Folder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const folderId = parseInt(id);

    if (isNaN(folderId)) {
      return NextResponse.json(
        { error: "Invalid folder ID" },
        { status: 400 }
      );
    }

    const { name, slug, sortOrder, parentId } = await request.json();

    // 驗證不能把資料夾移到自己裡面
    if (parentId === folderId) {
      return NextResponse.json(
        { error: "Cannot move folder into itself" },
        { status: 400 }
      );
    }

    // 驗證不能移到自己的子資料夾裡
    if (parentId) {
      const targetPath = await getFolderPath(parentId);
      if (targetPath.some(p => p.id === folderId)) {
        return NextResponse.json(
          { error: "Cannot move folder into its own subfolder" },
          { status: 400 }
        );
      }
    }

    const folder = await prisma.mediaFolder.update({
      where: { id: folderId },
      data: {
        ...(name && { name: name.trim() }),
        ...(slug && { slug }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(parentId !== undefined && { parentId: parentId || null }),
      },
      include: {
        _count: {
          select: { media: true, children: true },
        },
      },
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Update media folder error:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Folder name already exists in this location" },
        { status: 409 }
      );
    }
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update media folder" },
      { status: 500 }
    );
  }
}

// DELETE /api/media/folders/[id] - 刪除 Media Folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const folderId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const recursive = searchParams.get("recursive") === "true";

    if (isNaN(folderId)) {
      return NextResponse.json(
        { error: "Invalid folder ID" },
        { status: 400 }
      );
    }

    const folder = await prisma.mediaFolder.findUnique({
      where: { id: folderId },
      include: {
        _count: {
          select: { media: true, children: true },
        },
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    // 檢查是否有子資料夾
    if (folder._count.children > 0 && !recursive) {
      return NextResponse.json(
        {
          error: `無法刪除：有 ${folder._count.children} 個子資料夾`,
          hasChildren: true,
          childrenCount: folder._count.children,
        },
        { status: 400 }
      );
    }

    // 檢查是否有媒體
    if (folder._count.media > 0 && !recursive) {
      return NextResponse.json(
        {
          error: `無法刪除：有 ${folder._count.media} 個媒體檔案`,
          hasMedia: true,
          mediaCount: folder._count.media,
        },
        { status: 400 }
      );
    }

    // 遞迴刪除（會因為 onDelete: Cascade 自動刪除子資料夾）
    // 但需要先把媒體移到根目錄
    if (recursive) {
      // 遞迴取得所有子資料夾 ID
      const getAllChildrenIds = async (parentId: number): Promise<number[]> => {
        const children = await prisma.mediaFolder.findMany({
          where: { parentId },
          select: { id: true },
        });
        const childIds = children.map(c => c.id);
        const grandchildIds = await Promise.all(
          childIds.map(id => getAllChildrenIds(id))
        );
        return [...childIds, ...grandchildIds.flat()];
      };

      const allFolderIds = [folderId, ...(await getAllChildrenIds(folderId))];

      // 把這些資料夾裡的媒體移到根目錄
      await prisma.media.updateMany({
        where: { folderId: { in: allFolderIds } },
        data: { folderId: null },
      });
    }

    await prisma.mediaFolder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete media folder error:", error);
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete media folder" },
      { status: 500 }
    );
  }
}
