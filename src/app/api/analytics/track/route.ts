import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/analytics/track - 追蹤瀏覽次數
export async function POST(request: NextRequest) {
  try {
    const { type, slug } = await request.json();

    if (!type || !slug) {
      return NextResponse.json(
        { error: "Missing type or slug" },
        { status: 400 }
      );
    }

    if (type === "photo") {
      await prisma.photo.update({
        where: { slug },
        data: { viewCount: { increment: 1 } },
      });
    } else if (type === "article") {
      await prisma.article.update({
        where: { slug },
        data: { viewCount: { increment: 1 } },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid type" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track view error:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}
