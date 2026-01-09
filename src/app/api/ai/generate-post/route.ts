import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface GenerateArticleRequest {
  imageUrl: string;
  prompt?: string;
  language?: "zh" | "en";
}

// POST /api/ai/generate-post - 根據封面圖片生成文章內容
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt, language = "zh" } = (await request.json()) as GenerateArticleRequest;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing imageUrl" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // 下載圖片並轉換為 base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 400 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // 偵測圖片類型
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const mimeType = contentType.split(";")[0];

    // 建立提示詞
    const systemPrompt = language === "zh"
      ? `你是一位專業的攝影部落格作家。根據這張照片，生成一篇攝影相關的部落格文章。請提供以下內容：

1. **title**: 吸引人的文章標題（中文，10-25字）
2. **slug**: 英文 URL 識別碼（小寫英文、數字、連字號，如：golden-hour-photography-tips）
3. **excerpt**: 文章摘要（中文，50-100字，用於預覽）
4. **category**: 最適合的分類（只能選一個）
   - 技巧分享（攝影技術、後製教學）
   - 旅行日記（旅途見聞、地點介紹）
   - 攝影思考（攝影哲學、創作心得）
   - 器材評測（相機、鏡頭評測）
5. **tags**: 精選 3 個最相關的標籤（中文或英文皆可）
6. **content**: 完整的文章內容（Markdown 格式，800-1500字）
   - 使用 ## 作為章節標題
   - 適當使用列表、引用等格式
   - 包含實用的攝影技巧或心得分享
   - 語氣親切但專業

請以 JSON 格式回應，不要有其他說明：
{
  "title": "文章標題",
  "slug": "article-slug",
  "excerpt": "文章摘要...",
  "category": "分類",
  "tags": ["標籤1", "標籤2", "標籤3"],
  "content": "## 第一段\\n\\n內容...\\n\\n## 第二段\\n\\n內容..."
}`
      : `You are a professional photography blog writer. Based on this photo, generate a photography-related blog article. Please provide:

1. **title**: An engaging article title (10-25 words)
2. **slug**: URL-friendly identifier (lowercase, hyphens, e.g., golden-hour-photography-tips)
3. **excerpt**: Article summary (50-100 words, for preview)
4. **category**: Best fitting category (choose one)
   - Tips & Techniques
   - Travel Diary
   - Photography Thoughts
   - Gear Review
5. **tags**: Exactly 3 relevant tags
6. **content**: Full article content (Markdown format, 800-1500 words)
   - Use ## for section headings
   - Use lists, quotes appropriately
   - Include practical photography tips or insights
   - Professional yet approachable tone

Respond in JSON format only:
{
  "title": "Article Title",
  "slug": "article-slug",
  "excerpt": "Summary...",
  "category": "Category",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "## Section 1\\n\\nContent...\\n\\n## Section 2\\n\\nContent..."
}`;

    const userPrompt = prompt
      ? language === "zh"
        ? `根據這張照片撰寫文章，${prompt}`
        : `Write an article about this photo, ${prompt}`
      : language === "zh"
        ? "請根據這張照片撰寫一篇攝影部落格文章"
        : "Please write a photography blog article based on this photo";

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      systemPrompt + "\n\n" + userPrompt,
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // 解析 JSON 回應
    let parsedResult;
    try {
      // 移除可能的 markdown code block
      const jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsedResult = JSON.parse(jsonText);
    } catch {
      // 如果解析失敗，返回預設值
      parsedResult = {
        title: "",
        slug: "",
        excerpt: "",
        category: "技巧分享",
        tags: [],
        content: text,
      };
    }

    // 確保 slug 格式正確
    const cleanSlug = (parsedResult.slug || "")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return NextResponse.json({
      success: true,
      title: parsedResult.title || "",
      slug: cleanSlug,
      excerpt: parsedResult.excerpt || "",
      category: parsedResult.category || "技巧分享",
      tags: parsedResult.tags || [],
      content: parsedResult.content || "",
    });
  } catch (error) {
    console.error("AI generate article error:", error);
    return NextResponse.json(
      { error: "Failed to generate article" },
      { status: 500 }
    );
  }
}
