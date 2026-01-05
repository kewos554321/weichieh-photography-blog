import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateUniqueAlbumSlug } from "@/lib/slug";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/albums/[slug] - 取得單一相簿詳情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";
    const token = searchParams.get("token");

    const album = await prisma.album.findUnique({
      where: { slug },
      include: {
        photos: {
          include: {
            photo: {
              include: {
                tags: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // 管理員可以看到所有內容
    if (admin) {
      const photos = album.photos.map((ap) => ap.photo);
      return NextResponse.json({ ...album, photos });
    }

    // 根據 visibility 檢查存取權限
    let hasAccess = false;

    switch (album.visibility) {
      case "public":
      case "unlisted":
        // public 和 unlisted 都可以直接訪問
        hasAccess = true;
        break;

      case "token":
        // 需要正確的 token
        if (token && token === album.accessToken) {
          // 檢查 token 是否過期
          if (!album.tokenExpiresAt || album.tokenExpiresAt >= new Date()) {
            hasAccess = true;
          }
        }
        break;

      case "password":
        // 檢查 cookie 是否有密碼驗證記錄
        const passwordCookie = request.cookies.get(`album_access_${album.id}`);
        if (passwordCookie?.value === "verified") {
          hasAccess = true;
        } else {
          // 回傳需要密碼的狀態（只回傳基本資訊）
          return NextResponse.json(
            {
              requiresPassword: true,
              id: album.id,
              slug: album.slug,
              name: album.name,
            },
            { status: 401 }
          );
        }
        break;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // 過濾未發布的照片（非管理員）
    const photos = album.photos
      .filter((ap) => ap.photo.status === "published")
      .map((ap) => ap.photo);

    return NextResponse.json({
      ...album,
      photos,
    });
  } catch (error) {
    console.error("Get album error:", error);
    return NextResponse.json(
      { error: "Failed to fetch album" },
      { status: 500 }
    );
  }
}

// PUT /api/albums/[slug] - 更新相簿
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const album = await prisma.album.findUnique({
      where: { slug },
      select: { name: true },
    });
    if (!album) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // 如果 name 有變更，重新產生 slug
    let newSlug: string | undefined;
    if (body.name && body.name !== album.name) {
      newSlug = await generateUniqueAlbumSlug(body.name, slug);
    }

    const updated = await prisma.album.update({
      where: { slug },
      data: {
        name: body.name,
        ...(newSlug && { slug: newSlug }),
        description: body.description !== undefined ? body.description : undefined,
        coverUrl: body.coverUrl !== undefined ? body.coverUrl : undefined,
        sortOrder: body.sortOrder,
        // 隱私控制欄位
        ...(body.visibility !== undefined && { visibility: body.visibility }),
        ...(body.accessToken !== undefined && { accessToken: body.accessToken }),
        ...(body.tokenExpiresAt !== undefined && {
          tokenExpiresAt: body.tokenExpiresAt
            ? new Date(body.tokenExpiresAt)
            : null,
        }),
        ...(body.accessPassword !== undefined && {
          accessPassword: body.accessPassword,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update album error:", error);
    return NextResponse.json(
      { error: "Failed to update album" },
      { status: 500 }
    );
  }
}

// DELETE /api/albums/[slug] - 刪除相簿
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const album = await prisma.album.findUnique({ where: { slug } });
    if (!album) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // 刪除相簿（照片關聯會因為 onDelete: Cascade 自動刪除）
    await prisma.album.delete({ where: { slug } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete album error:", error);
    return NextResponse.json(
      { error: "Failed to delete album" },
      { status: 500 }
    );
  }
}
