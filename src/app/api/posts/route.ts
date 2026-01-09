import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndPublish } from "@/lib/publish";

// GET /api/posts - 取得文章列表
export async function GET(request: NextRequest) {
  try {
    // 自動發布到期的排程內容（每 60 秒最多檢查一次）
    await checkAndPublish();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const admin = searchParams.get("admin") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (category && category !== "全部") where.category = category;
    if (tag) where.tags = { some: { name: tag } };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
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

    const [articles, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
        include: {
          tags: true,
        },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({ articles, total });
  } catch (error) {
    console.error("Get articles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST /api/posts - 新增文章
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { slug, title, excerpt, content, cover, category } = body;
    if (!slug || !title || !excerpt || !content || !cover || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 檢查 slug 是否已存在
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }

    // 計算閱讀時間 (假設每分鐘 300 字)
    const readTime = Math.ceil(content.length / 300);

    const post = await prisma.post.create({
      data: {
        slug,
        title,
        excerpt,
        content,
        cover,
        category,
        readTime,
        date: body.date ? new Date(body.date) : new Date(),
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

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
