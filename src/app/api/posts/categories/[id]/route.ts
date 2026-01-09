import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/posts/categories/[id] - 更新 Post Category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const { name, slug, sortOrder } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const category = await prisma.postCategory.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        ...(slug && { slug }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Update post category error:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 409 }
      );
    }
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update post category" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/categories/[id] - 刪除 Post Category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    // 檢查是否有文章使用此分類
    const articlesUsingCategory = await prisma.post.count({
      where: { category: (await prisma.postCategory.findUnique({ where: { id: categoryId } }))?.name },
    });

    if (articlesUsingCategory > 0) {
      return NextResponse.json(
        { error: `無法刪除：有 ${articlesUsingCategory} 篇文章正在使用此分類` },
        { status: 400 }
      );
    }

    await prisma.postCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post category error:", error);
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete post category" },
      { status: 500 }
    );
  }
}
