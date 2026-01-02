import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/articles/tags - 取得所有 Article Tags
export async function GET() {
  try {
    const tags = await prisma.articleTag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Get article tags error:", error);
    return NextResponse.json(
      { error: "Failed to fetch article tags" },
      { status: 500 }
    );
  }
}

// POST /api/articles/tags - 新增 Article Tag
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    const tag = await prisma.articleTag.create({
      data: { name: name.trim() },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Create article tag error:", error);
    // 檢查是否為重複名稱錯誤
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Tag already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create article tag" },
      { status: 500 }
    );
  }
}
