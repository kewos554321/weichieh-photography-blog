import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/articles - 取得文章列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const published = searchParams.get("published");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (category && category !== "全部") where.category = category;
    if (published !== null) where.published = published === "true";

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          cover: true,
          category: true,
          readTime: true,
          date: true,
          published: true,
        },
      }),
      prisma.article.count({ where }),
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

// POST /api/articles - 新增文章
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
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }

    // 計算閱讀時間 (假設每分鐘 300 字)
    const readTime = Math.ceil(content.length / 300);

    const article = await prisma.article.create({
      data: {
        slug,
        title,
        excerpt,
        content,
        cover,
        category,
        readTime,
        date: body.date ? new Date(body.date) : new Date(),
        published: body.published ?? false,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("Create article error:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
