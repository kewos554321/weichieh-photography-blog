import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/articles/categories/[id] - 更新 Article Category
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

    const category = await prisma.articleCategory.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        ...(slug && { slug }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Update article category error:", error);
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
      { error: "Failed to update article category" },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/categories/[id] - 刪除 Article Category
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
    const articlesUsingCategory = await prisma.article.count({
      where: { category: (await prisma.articleCategory.findUnique({ where: { id: categoryId } }))?.name },
    });

    if (articlesUsingCategory > 0) {
      return NextResponse.json(
        { error: `無法刪除：有 ${articlesUsingCategory} 篇文章正在使用此分類` },
        { status: 400 }
      );
    }

    await prisma.articleCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete article category error:", error);
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete article category" },
      { status: 500 }
    );
  }
}
