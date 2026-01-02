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
2. **story**: 富有情感的故事描述（中文，100-200字）
   - 描述畫面中的光影、色彩、氛圍
   - 融入攝影師的觀察視角
   - 適當使用比喻和意象
3. **category**: 最適合的分類（只能選一個）
   - Portrait（人像）
   - Landscape（風景）
   - Street（街拍）
   - Nature（自然）
   - Architecture（建築）
   - Documentary（紀實）
   - Abstract（抽象）
4. **tags**: 3-5個相關標籤（中文或英文皆可）

請以 JSON 格式回應，不要有其他說明：
{
  "title": "標題",
  "story": "故事內容",
  "category": "分類",
  "tags": ["標籤1", "標籤2", "標籤3"]
}`
      : `You are a professional photographer and storyteller. Analyze this photo and generate:

1. **title**: A poetic title (5-10 words)
2. **story**: An emotional story description (100-200 words)
   - Describe the light, colors, and atmosphere
   - Incorporate the photographer's perspective
   - Use appropriate metaphors and imagery
3. **category**: The best fitting category (choose one)
   - Portrait
   - Landscape
   - Street
   - Nature
   - Architecture
   - Documentary
   - Abstract
4. **tags**: 3-5 relevant tags

Respond in JSON format only, no other explanation:
{
  "title": "Title here",
  "story": "Story content",
  "category": "Category",
  "tags": ["tag1", "tag2", "tag3"]
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
        story: text,
        category: "Portrait",
        tags: [],
      };
    }

    return NextResponse.json({
      success: true,
      title: parsedResult.title || "",
      story: parsedResult.story || "",
      category: parsedResult.category || "Portrait",
      tags: parsedResult.tags || [],
    });
  } catch (error) {
    console.error("AI generate story error:", error);
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
