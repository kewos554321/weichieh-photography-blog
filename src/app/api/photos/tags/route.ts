import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/photos/tags - 取得所有 Photo Tags
export async function GET() {
  try {
    const tags = await prisma.photoTag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { photos: true },
        },
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Get photo tags error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo tags" },
      { status: 500 }
    );
  }
}

// POST /api/photos/tags - 新增 Photo Tag
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    const tag = await prisma.photoTag.create({
      data: { name: name.trim() },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Create photo tag error:", error);
    // 檢查是否為重複名稱錯誤
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Tag already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create photo tag" },
      { status: 500 }
    );
  }
}
