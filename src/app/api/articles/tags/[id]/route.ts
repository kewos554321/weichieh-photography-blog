import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/articles/tags/[id] - 更新 Article Tag
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

    const tag = await prisma.articleTag.update({
      where: { id: tagId },
      data: { name: name.trim() },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Update article tag error:", error);
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
      { error: "Failed to update article tag" },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/tags/[id] - 刪除 Article Tag
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

    await prisma.articleTag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete article tag error:", error);
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete article tag" },
      { status: 500 }
    );
  }
}
