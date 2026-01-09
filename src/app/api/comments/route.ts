import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited, hashIP, getClientIP } from "@/lib/rateLimit";

// GET /api/comments - List all comments (admin only)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED
  const photoId = searchParams.get("photoId");
  const postId = searchParams.get("postId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  try {
    const where: {
      status?: "PENDING" | "APPROVED" | "REJECTED";
      photoId?: number;
      postId?: number;
    } = {};

    if (status === "PENDING" || status === "APPROVED" || status === "REJECTED") {
      where.status = status;
    }
    if (photoId) where.photoId = parseInt(photoId);
    if (postId) where.postId = parseInt(postId);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          photo: {
            select: { id: true, slug: true, title: true },
          },
          post: {
            select: { id: true, slug: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    return NextResponse.json({
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/comments - Create a new comment
export async function POST(request: Request) {
  try {
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);

    // Rate limit: 5 comments per hour per IP
    const rateLimit = isRateLimited(`comment:${ipHash}`, {
      windowMs: 3600000, // 1 hour
      maxRequests: 5,
    });

    if (rateLimit.limited) {
      return NextResponse.json(
        {
          error: "留言次數已達上限，請稍後再試",
          resetAt: rateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    const { name, content, photoId, postId } = await request.json();

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "請填寫名稱" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "請填寫留言內容" },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: "留言內容不得超過 1000 字" },
        { status: 400 }
      );
    }

    if (!photoId && !postId) {
      return NextResponse.json(
        { error: "請指定照片或文章" },
        { status: 400 }
      );
    }

    // Create comment (default status: PENDING)
    const comment = await prisma.comment.create({
      data: {
        name: name.trim().slice(0, 50), // Max 50 chars for name
        content: content.trim(),
        photoId: photoId ? parseInt(photoId) : null,
        postId: postId ? parseInt(postId) : null,
        ipHash,
        status: "PENDING",
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "留言失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
