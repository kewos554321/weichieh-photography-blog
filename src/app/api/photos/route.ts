import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/photos - 取得照片列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const admin = searchParams.get("admin") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

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
      where.AND = [
        {
          OR: [
            { publishedAt: null },
            { publishedAt: { lte: new Date() } },
          ],
        },
      ];
    }

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        orderBy: { date: "desc" },
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
        date: new Date(date),
        camera: body.camera || null,
        lens: body.lens || null,
        story,
        behindTheScene: body.behindTheScene || null,
        status: body.status || "draft",
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        ...(body.tagIds && {
          tags: {
            connect: body.tagIds.map((id: number) => ({ id })),
          },
        }),
      },
      include: {
        tags: true,
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
