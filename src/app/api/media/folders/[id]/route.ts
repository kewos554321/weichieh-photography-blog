import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const { name, slug, sortOrder } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    const folder = await prisma.mediaFolder.update({
      where: { id: folderId },
      data: {
        name: name.trim(),
        ...(slug && { slug }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Update media folder error:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Folder name already exists" },
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

    if (isNaN(folderId)) {
      return NextResponse.json(
        { error: "Invalid folder ID" },
        { status: 400 }
      );
    }

    // 檢查是否有媒體使用此資料夾
    const mediaUsingFolder = await prisma.media.count({
      where: { folderId },
    });

    if (mediaUsingFolder > 0) {
      return NextResponse.json(
        { error: `無法刪除：有 ${mediaUsingFolder} 個媒體正在使用此資料夾` },
        { status: 400 }
      );
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
