import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/albums/categories - 取得所有 Album Categories
export async function GET() {
  try {
    const categories = await prisma.albumCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { albums: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Get album categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch album categories" },
      { status: 500 }
    );
  }
}

// POST /api/albums/categories - 新增 Album Category
export async function POST(request: NextRequest) {
  try {
    const { name, slug, sortOrder } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // 自動生成 slug（如果沒有提供）
    const categorySlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();

    const category = await prisma.albumCategory.create({
      data: {
        name: name.trim(),
        slug: categorySlug,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Create album category error:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create album category" },
      { status: 500 }
    );
  }
}
