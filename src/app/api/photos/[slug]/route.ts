import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateUniquePhotoSlug } from "@/lib/slug";

type RouteParams = { params: Promise<{ slug: string }> };

// GET /api/photos/[slug] - 取得單張照片
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";
    const includeContext = searchParams.get("context") === "true";

    // 取得訪客 token
    const visitorToken = request.cookies.get("visitor_token")?.value;

    const photo = await prisma.photo.findUnique({
      where: { slug },
      include: {
        tags: true,
        post: {
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            cover: true,
            status: true,
          },
        },
        albums: {
          include: {
            album: {
              select: {
                id: true,
                slug: true,
                name: true,
                visibility: true,
              },
            },
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // 管理員可以看到所有內容
    if (admin) {
      return NextResponse.json(photo);
    }

    // 非管理員只能查看已發佈且發佈時間已到的內容
    const isPublished = photo.status === "published";
    const isScheduleReady =
      !photo.publishedAt || photo.publishedAt <= new Date();
    if (!isPublished || !isScheduleReady) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // 根據 visibility 檢查存取權限
    let hasAccess = false;
    if (photo.visibility === "public") {
      hasAccess = true;
    } else if (photo.visibility === "private" && visitorToken) {
      const accessToken = await prisma.accessToken.findUnique({
        where: { token: visitorToken },
        include: {
          photos: { where: { photoId: photo.id } },
        },
      });

      if (
        accessToken?.isActive &&
        accessToken.photos.length > 0 &&
        (!accessToken.expiresAt || accessToken.expiresAt > new Date())
      ) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // If context is requested, fetch related photos and navigation
    if (includeContext) {
      const baseWhere = {
        status: "published" as const,
        visibility: "public" as const,
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      };

      // Fetch related photos (same category, exclude current, limit 4)
      const relatedPhotos = await prisma.photo.findMany({
        where: {
          ...baseWhere,
          category: photo.category,
          slug: { not: slug },
        },
        select: {
          slug: true,
          src: true,
          title: true,
          location: true,
          category: true,
        },
        orderBy: { date: "desc" },
        take: 4,
      });

      // Fetch prev/next photos for navigation (by date order)
      const [prevPhoto, nextPhoto] = await Promise.all([
        prisma.photo.findFirst({
          where: {
            ...baseWhere,
            date: { lt: photo.date },
          },
          select: { slug: true, title: true },
          orderBy: { date: "desc" },
        }),
        prisma.photo.findFirst({
          where: {
            ...baseWhere,
            date: { gt: photo.date },
          },
          select: { slug: true, title: true },
          orderBy: { date: "asc" },
        }),
      ]);

      return NextResponse.json({
        ...photo,
        related: relatedPhotos,
        navigation: { prev: prevPhoto, next: nextPhoto },
      });
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Get photo error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}

// PUT /api/photos/[slug] - 更新照片
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // 取得目前的照片
    const currentPhoto = await prisma.photo.findUnique({
      where: { slug },
      select: { title: true },
    });

    if (!currentPhoto) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // 如果 title 有變更，重新產生 slug
    let newSlug: string | undefined;
    if (body.title && body.title !== currentPhoto.title) {
      newSlug = await generateUniquePhotoSlug(body.title, slug);
    }

    const photo = await prisma.photo.update({
      where: { slug },
      data: {
        title: body.title,
        ...(newSlug && { slug: newSlug }),
        category: body.category,
        location: body.location,
        ...(body.latitude !== undefined && { latitude: body.latitude }),
        ...(body.longitude !== undefined && { longitude: body.longitude }),
        date: body.date ? new Date(body.date) : undefined,
        camera: body.camera,
        lens: body.lens,
        story: body.story,
        behindTheScene: body.behindTheScene,
        status: body.status,
        publishedAt:
          body.publishedAt !== undefined
            ? body.publishedAt
              ? new Date(body.publishedAt)
              : null
            : undefined,
        ...(body.src && { src: body.src }),
        ...(body.tagIds !== undefined && {
          tags: {
            set: body.tagIds.map((id: number) => ({ id })),
          },
        }),
        ...(body.postId !== undefined && {
          postId: body.postId,
        }),
        // 隱私控制欄位（簡化版）
        ...(body.visibility !== undefined && { visibility: body.visibility }),
      },
      include: {
        tags: true,
        post: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Update photo error:", error);
    return NextResponse.json(
      { error: "Failed to update photo" },
      { status: 500 }
    );
  }
}

// DELETE /api/photos/[slug] - 刪除照片
// ?deleteMedia=true 時同時刪除關聯的 media 檔案
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const deleteMedia = searchParams.get("deleteMedia") === "true";

    const photo = await prisma.photo.findUnique({
      where: { slug },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // 如果要刪除 media，先找到對應的 media 記錄
    let mediaToDelete = null;
    if (deleteMedia && photo.src) {
      mediaToDelete = await prisma.media.findFirst({
        where: { url: photo.src },
      });
    }

    // 刪除 photo 記錄
    await prisma.photo.delete({
      where: { slug },
    });

    // 刪除 media（如果有且要求刪除）
    if (mediaToDelete) {
      try {
        // 呼叫 media 刪除 API（使用 force=true 因為 photo 已刪除）
        const mediaRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/media/${mediaToDelete.id}?force=true`,
          { method: "DELETE" }
        );
        if (!mediaRes.ok) {
          console.error("Failed to delete media:", await mediaRes.text());
        }
      } catch (mediaError) {
        console.error("Failed to delete media:", mediaError);
        // 繼續，因為 photo 已刪除成功
      }
    }

    return NextResponse.json({ success: true, mediaDeleted: !!mediaToDelete });
  } catch (error) {
    console.error("Delete photo error:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
