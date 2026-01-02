import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/photos/categories/[id] - 更新 Photo Category
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

    const category = await prisma.photoCategory.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        ...(slug && { slug }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Update photo category error:", error);
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
      { error: "Failed to update photo category" },
      { status: 500 }
    );
  }
}

// DELETE /api/photos/categories/[id] - 刪除 Photo Category
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

    // 檢查是否有照片使用此分類
    const photosUsingCategory = await prisma.photo.count({
      where: { category: (await prisma.photoCategory.findUnique({ where: { id: categoryId } }))?.name },
    });

    if (photosUsingCategory > 0) {
      return NextResponse.json(
        { error: `無法刪除：有 ${photosUsingCategory} 張照片正在使用此分類` },
        { status: 400 }
      );
    }

    await prisma.photoCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete photo category error:", error);
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete photo category" },
      { status: 500 }
    );
  }
}
