import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface GenerateSlugRequest {
  title: string;
  type: "photo" | "article" | "album";
  excludeSlug?: string; // 編輯時排除自己
}

// 確保 slug 唯一
async function ensureUniqueSlug(
  baseSlug: string,
  type: "photo" | "article" | "album",
  excludeSlug?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let existing: { slug: string } | null = null;

    if (type === "photo") {
      existing = await prisma.photo.findUnique({ where: { slug }, select: { slug: true } });
    } else if (type === "article") {
      existing = await prisma.article.findUnique({ where: { slug }, select: { slug: true } });
    } else if (type === "album") {
      existing = await prisma.album.findUnique({ where: { slug }, select: { slug: true } });
    }

    if (!existing || (excludeSlug && existing.slug === excludeSlug)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// POST /api/ai/generate-slug - 根據標題生成 URL slug
export async function POST(request: NextRequest) {
  try {
    const { title, type, excludeSlug } = (await request.json()) as GenerateSlugRequest;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Missing title" },
        { status: 400 }
      );
    }

    if (!type || !["photo", "article", "album"].includes(type)) {
      return NextResponse.json(
        { error: "Missing or invalid type (must be 'photo', 'article', or 'album')" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Generate a URL-friendly slug for the following title. The slug should be:
- In English (translate if the title is in another language)
- Lowercase
- Use hyphens instead of spaces
- Short and concise (2-5 words)
- No special characters
- Descriptive and meaningful

Title: "${title}"

Respond with ONLY the slug, nothing else. For example:
- "夕陽下的漁港" → "sunset-fishing-harbor"
- "Mountain Landscape" → "mountain-landscape"
- "街頭攝影技巧分享" → "street-photography-tips"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up the slug
    const baseSlug = text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Ensure unique slug
    const slug = await ensureUniqueSlug(baseSlug, type, excludeSlug);

    return NextResponse.json({
      success: true,
      slug,
    });
  } catch (error) {
    console.error("Generate slug error:", error);
    return NextResponse.json(
      { error: "Failed to generate slug" },
      { status: 500 }
    );
  }
}
