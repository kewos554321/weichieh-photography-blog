import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/albums/tags - 取得所有 Album Tags
export async function GET() {
  try {
    const tags = await prisma.albumTag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { albums: true },
        },
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Get album tags error:", error);
    return NextResponse.json(
      { error: "Failed to fetch album tags" },
      { status: 500 }
    );
  }
}

// POST /api/albums/tags - 新增 Album Tag
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    const tag = await prisma.albumTag.create({
      data: { name: name.trim() },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Create album tag error:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Tag already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create album tag" },
      { status: 500 }
    );
  }
}
