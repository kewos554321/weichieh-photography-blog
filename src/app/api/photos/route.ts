import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndPublish } from "@/lib/publish";

// GET /api/photos - 取得照片列表
export async function GET(request: NextRequest) {
  try {
    // 自動發布到期的排程內容（非阻塞，不等待完成）
    checkAndPublish().catch(() => {});
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const admin = searchParams.get("admin") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortField = searchParams.get("sortField") || "date";
    const sortDirection = searchParams.get("sortDirection") || "desc";

    // 取得訪客 token
    const visitorToken = request.cookies.get("visitor_token")?.value;

    const where: Record<string, unknown> = {};
    if (category && category !== "All") where.category = category;
    if (tag) where.tags = { some: { name: tag } };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    // 狀態篩選
    if (status) {
      where.status = status;
    } else if (!admin) {
      // 公開頁面只顯示已發佈且發佈時間已到的內容
      where.status = "published";

      // 取得訪客 token 授權的照片 ID
      let authorizedPhotoIds: number[] = [];
      if (visitorToken) {
        const accessToken = await prisma.accessToken.findUnique({
          where: { token: visitorToken },
          include: {
            photos: { select: { photoId: true } },
          },
        });

        if (accessToken?.isActive) {
          // 檢查是否過期
          if (!accessToken.expiresAt || accessToken.expiresAt > new Date()) {
            authorizedPhotoIds = accessToken.photos.map((p) => p.photoId);
          }
        }
      }

      // 顯示 public 或 token 授權的 private 照片
      if (authorizedPhotoIds.length > 0) {
        where.AND = [
          {
            OR: [
              { publishedAt: null },
              { publishedAt: { lte: new Date() } },
            ],
          },
          {
            OR: [
              { visibility: "public" },
              { id: { in: authorizedPhotoIds }, visibility: "private" },
            ],
          },
        ];
      } else {
        // 沒有 token，只顯示 public
        where.visibility = "public";
        where.AND = [
          {
            OR: [
              { publishedAt: null },
              { publishedAt: { lte: new Date() } },
            ],
          },
        ];
      }
    }

    // Build orderBy based on sortField
    const orderByMap: Record<string, Record<string, "asc" | "desc">> = {
      title: { title: sortDirection as "asc" | "desc" },
      location: { location: sortDirection as "asc" | "desc" },
      category: { category: sortDirection as "asc" | "desc" },
      status: { status: sortDirection as "asc" | "desc" },
      date: { date: sortDirection as "asc" | "desc" },
    };
    const orderBy = orderByMap[sortField] || { date: "desc" };

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          tags: true,
        },
      }),
      prisma.photo.count({ where }),
    ]);

    return NextResponse.json({ photos, total });
  } catch (error) {
    console.error("Get photos error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

// POST /api/photos - 新增照片
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 驗證必填欄位
    const { slug, title, src, category, location, date, story } = body;
    if (!slug || !title || !src || !category || !location || !date || !story) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 檢查 slug 是否已存在
    const existing = await prisma.photo.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }

    const photo = await prisma.photo.create({
      data: {
        slug,
        title,
        src,
        category,
        location,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        date: new Date(date),
        camera: body.camera || null,
        lens: body.lens || null,
        story,
        behindTheScene: body.behindTheScene || null,
        status: body.status || "draft",
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        postId: body.postId || null,
        // 隱私控制欄位（簡化版）
        visibility: body.visibility || "public",
        ...(body.tagIds && {
          tags: {
            connect: body.tagIds.map((id: number) => ({ id })),
          },
        }),
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

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Create photo error:", error);
    return NextResponse.json(
      { error: "Failed to create photo" },
      { status: 500 }
    );
  }
}
