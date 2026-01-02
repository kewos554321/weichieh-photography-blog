import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/photos/categories - 取得所有 Photo Categories
export async function GET() {
  try {
    const categories = await prisma.photoCategory.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Get photo categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo categories" },
      { status: 500 }
    );
  }
}

// POST /api/photos/categories - 新增 Photo Category
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

    const category = await prisma.photoCategory.create({
      data: {
        name: name.trim(),
        slug: categorySlug,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Create photo category error:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create photo category" },
      { status: 500 }
    );
  }
}
