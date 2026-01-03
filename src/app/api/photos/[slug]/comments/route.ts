import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/photos/[slug]/comments - Get approved comments for a photo
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const photo = await prisma.photo.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        photoId: photo.id,
        status: "APPROVED",
      },
      select: {
        id: true,
        name: true,
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Failed to fetch photo comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
