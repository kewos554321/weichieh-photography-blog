import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashIP, getClientIP } from "@/lib/rateLimit";

// GET /api/photos/[slug]/like - Check if user has liked & get count
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);

    const photo = await prisma.photo.findUnique({
      where: { slug },
      select: { id: true, likeCount: true },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    // Check if this IP has liked
    const existingLike = await prisma.like.findUnique({
      where: {
        photoId_ipHash: {
          photoId: photo.id,
          ipHash,
        },
      },
    });

    return NextResponse.json({
      liked: !!existingLike,
      likeCount: photo.likeCount,
    });
  } catch (error) {
    console.error("Failed to get like status:", error);
    return NextResponse.json(
      { error: "Failed to get like status" },
      { status: 500 }
    );
  }
}

// POST /api/photos/[slug]/like - Toggle like
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);

    const photo = await prisma.photo.findUnique({
      where: { slug },
      select: { id: true, likeCount: true },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        photoId_ipHash: {
          photoId: photo.id,
          ipHash,
        },
      },
    });

    if (existingLike) {
      // Unlike: delete like and decrement count
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id },
        }),
        prisma.photo.update({
          where: { id: photo.id },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({
        liked: false,
        likeCount: photo.likeCount - 1,
      });
    } else {
      // Like: create like and increment count
      await prisma.$transaction([
        prisma.like.create({
          data: {
            photoId: photo.id,
            ipHash,
          },
        }),
        prisma.photo.update({
          where: { id: photo.id },
          data: { likeCount: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({
        liked: true,
        likeCount: photo.likeCount + 1,
      });
    }
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
