import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/media/tags/[id] - 更新媒體標籤
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tagId = parseInt(id);
    const body = await request.json();

    if (isNaN(tagId)) {
      return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
    }

    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    const tag = await prisma.mediaTag.update({
      where: { id: tagId },
      data: { name: name.trim() },
      include: {
        _count: {
          select: { media: true },
        },
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    // 處理重複名稱錯誤
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Tag already exists" },
        { status: 409 }
      );
    }
    // 處理找不到錯誤
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }
    console.error("Update media tag error:", error);
    return NextResponse.json(
      { error: "Failed to update media tag" },
      { status: 500 }
    );
  }
}

// DELETE /api/media/tags/[id] - 刪除媒體標籤
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

    await prisma.mediaTag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // 處理找不到錯誤
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }
    console.error("Delete media tag error:", error);
    return NextResponse.json(
      { error: "Failed to delete media tag" },
      { status: 500 }
    );
  }
}
