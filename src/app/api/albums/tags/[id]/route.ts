import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/albums/tags/[id] - 更新 Album Tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tagId = parseInt(id);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    const tag = await prisma.albumTag.update({
      where: { id: tagId },
      data: { name: name.trim() },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Update album tag error:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Tag name already exists" },
        { status: 409 }
      );
    }
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update album tag" },
      { status: 500 }
    );
  }
}

// DELETE /api/albums/tags/[id] - 刪除 Album Tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tagId = parseInt(id);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
    }

    // 檢查是否有相簿使用此標籤
    const albumsUsingTag = await prisma.album.count({
      where: {
        tags: {
          some: { id: tagId },
        },
      },
    });

    if (albumsUsingTag > 0) {
      return NextResponse.json(
        { error: `無法刪除：有 ${albumsUsingTag} 個相簿正在使用此標籤` },
        { status: 400 }
      );
    }

    await prisma.albumTag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete album tag error:", error);
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete album tag" },
      { status: 500 }
    );
  }
}
