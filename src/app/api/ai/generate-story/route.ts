import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface GenerateStoryRequest {
  imageUrl: string;
  prompt?: string;
  language?: "zh" | "en";
}

// POST /api/ai/generate-story - 根據圖片生成故事、標題、標籤、分類
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt, language = "zh" } = (await request.json()) as GenerateStoryRequest;

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
      ? `你是一位專業的攝影師和故事作家。分析這張照片並生成以下內容：

1. **title**: 一個有詩意的標題（中文，5-15字）
2. **slug**: 根據照片內容產生的英文 URL 識別碼（小寫英文、數字、連字號，如：golden-hour-taipei-street）
3. **story**: 富有情感的故事描述（中文，100-200字）
   - 描述畫面中的光影、色彩、氛圍
   - 融入攝影師的觀察視角
   - 適當使用比喻和意象
4. **category**: 最適合的分類（只能選一個）
   - Portrait（人像）
   - Landscape（風景）
   - Street（街拍）
   - Nature（自然）
   - Architecture（建築）
   - Documentary（紀實）
   - Abstract（抽象）
5. **tags**: 精選 3 個最相關的標籤（中文或英文皆可，不要超過 3 個）
6. **location**: 如果從圖片或描述中能判斷拍攝地點，請填寫地點名稱（如：台北、東京、巴黎）。如果無法判斷，返回 null
7. **date**: 如果從描述中能判斷拍攝日期，請填寫日期（格式：YYYY-MM-DD）。如果無法判斷，返回 null
8. **camera**: 如果從圖片 EXIF 特徵或描述中能判斷相機型號，請填寫。如果無法判斷，返回 null
9. **lens**: 如果從圖片特徵或描述中能判斷鏡頭，請填寫。如果無法判斷，返回 null

請以 JSON 格式回應，不要有其他說明：
{
  "title": "中文標題",
  "slug": "english-slug-here",
  "story": "故事內容",
  "category": "分類",
  "tags": ["標籤1", "標籤2", "標籤3"],  // 只給 3 個
  "location": "地點或null",
  "date": "YYYY-MM-DD或null",
  "camera": "相機型號或null",
  "lens": "鏡頭或null"
}`
      : `You are a professional photographer and storyteller. Analyze this photo and generate:

1. **title**: A poetic title (5-10 words)
2. **slug**: A URL-friendly identifier based on the photo content (lowercase letters, numbers, hyphens only, e.g., golden-hour-city-lights)
3. **story**: An emotional story description (100-200 words)
   - Describe the light, colors, and atmosphere
   - Incorporate the photographer's perspective
   - Use appropriate metaphors and imagery
4. **category**: The best fitting category (choose one)
   - Portrait
   - Landscape
   - Street
   - Nature
   - Architecture
   - Documentary
   - Abstract
5. **tags**: Exactly 3 most relevant tags (no more than 3)
6. **location**: If you can determine the shooting location from the image or description, provide the location name (e.g., Tokyo, Paris, New York). Return null if unknown
7. **date**: If you can determine the shooting date from the description, provide the date (format: YYYY-MM-DD). Return null if unknown
8. **camera**: If you can determine the camera model from image characteristics or description, provide it. Return null if unknown
9. **lens**: If you can determine the lens from image characteristics or description, provide it. Return null if unknown

Respond in JSON format only, no other explanation:
{
  "title": "Title here",
  "slug": "english-slug-here",
  "story": "Story content",
  "category": "Category",
  "tags": ["tag1", "tag2", "tag3"],
  "location": "location or null",
  "date": "YYYY-MM-DD or null",
  "camera": "camera model or null",
  "lens": "lens or null"
}`;

    const userPrompt = prompt
      ? language === "zh"
        ? `根據這張照片，${prompt}`
        : `Based on this photo, ${prompt}`
      : language === "zh"
        ? "請分析這張照片"
        : "Please analyze this photo";

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
      // 如果解析失敗，返回純文字作為 story
      parsedResult = {
        title: "",
        slug: "",
        story: text,
        category: "Portrait",
        tags: [],
        location: null,
        date: null,
        camera: null,
        lens: null,
      };
    }

    // 確保 slug 格式正確（小寫、只有英文數字連字號）
    const cleanSlug = (parsedResult.slug || "")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return NextResponse.json({
      success: true,
      title: parsedResult.title || "",
      slug: cleanSlug,
      story: parsedResult.story || "",
      category: parsedResult.category || "Portrait",
      tags: parsedResult.tags || [],
      location: parsedResult.location || null,
      date: parsedResult.date || null,
      camera: parsedResult.camera || null,
      lens: parsedResult.lens || null,
    });
  } catch (error) {
    console.error("AI generate story error:", error);
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
