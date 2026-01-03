import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/media/tags - 取得所有媒體標籤
export async function GET() {
  try {
    const tags = await prisma.mediaTag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { media: true },
        },
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Get media tags error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media tags" },
      { status: 500 }
    );
  }
}

// POST /api/media/tags - 建立新媒體標籤
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    const tag = await prisma.mediaTag.create({
      data: {
        name: name.trim(),
      },
      include: {
        _count: {
          select: { media: true },
        },
      },
    });

    return NextResponse.json(tag, { status: 201 });
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
    console.error("Create media tag error:", error);
    return NextResponse.json(
      { error: "Failed to create media tag" },
      { status: 500 }
    );
  }
}
