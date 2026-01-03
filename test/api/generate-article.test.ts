import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions that will be used in the vi.mock factory
const mockGenerateContent = vi.fn();

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: function() {
      return {
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      };
    },
  };
});

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { POST } from "@/app/api/ai/generate-article/route";

describe("Generate Article API", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-api-key" };
  });

  it("should return error when imageUrl is missing", async () => {
    const request = new NextRequest("http://localhost/api/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing imageUrl");
  });

  it("should return error when GEMINI_API_KEY is not configured", async () => {
    process.env.GEMINI_API_KEY = "";

    const request = new NextRequest("http://localhost/api/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({ imageUrl: "https://example.com/image.jpg" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("GEMINI_API_KEY is not configured");
  });

  it("should return error when image fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    const request = new NextRequest("http://localhost/api/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({ imageUrl: "https://example.com/image.jpg" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Failed to fetch image");
  });

  it("should generate article successfully with Chinese language", async () => {
    // Mock image fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      headers: new Map([["content-type", "image/jpeg"]]),
    });

    // Mock AI response
    const aiResponse = {
      title: "測試標題",
      slug: "test-article",
      excerpt: "這是摘要",
      category: "技巧分享",
      tags: ["攝影", "技巧", "教學"],
      content: "## 內容\n\n這是文章內容",
    };

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(aiResponse),
      },
    });

    const request = new NextRequest("http://localhost/api/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/image.jpg",
        language: "zh",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.title).toBe("測試標題");
    expect(data.slug).toBe("test-article");
  });

  it("should generate article with English language", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      headers: new Map([["content-type", "image/png"]]),
    });

    const aiResponse = {
      title: "Test Title",
      slug: "test-article-en",
      excerpt: "This is a summary",
      category: "Tips & Techniques",
      tags: ["photography", "tips", "tutorial"],
      content: "## Content\n\nThis is the article content",
    };

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(aiResponse),
      },
    });

    const request = new NextRequest("http://localhost/api/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/image.png",
        language: "en",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.title).toBe("Test Title");
  });

  it("should generate article with custom prompt", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      headers: new Map([["content-type", "image/jpeg"]]),
    });

    const aiResponse = {
      title: "Custom Prompt Title",
      slug: "custom-prompt",
      excerpt: "Summary",
      category: "技巧分享",
      tags: ["tag1", "tag2", "tag3"],
      content: "Content",
    };

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(aiResponse),
      },
    });

    const request = new NextRequest("http://localhost/api/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/image.jpg",
        prompt: "寫一篇關於風景攝影的文章",
        language: "zh",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should handle JSON parsing error gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      headers: new Map([["content-type", "image/jpeg"]]),
    });

    // Return invalid JSON
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => "This is not valid JSON",
      },
    });

    const request = new NextRequest("http://localhost/api/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/image.jpg",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.content).toBe("This is not valid JSON");
  });

  it("should handle JSON with markdown code blocks", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      headers: new Map([["content-type", "image/jpeg"]]),
    });

    const aiResponse = {
      title: "Title",
      slug: "test",
      excerpt: "Excerpt",
      category: "技巧分享",
      tags: [],
      content: "Content",
    };

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => "```json\n" + JSON.stringify(aiResponse) + "\n```",
      },
    });

    const request = new NextRequest("http://localhost/api/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/image.jpg",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("Title");
  });

  it("should clean slug properly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      headers: new Map([["content-type", "image/jpeg"]]),
    });

    const aiResponse = {
      title: "Title",
      slug: "Test Slug With Spaces!!!",
      excerpt: "Excerpt",
      category: "技巧分享",
      tags: [],
      content: "Content",
    };

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(aiResponse),
      },
    });

    const request = new NextRequest("http://localhost/api/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/image.jpg",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.slug).toBe("test-slug-with-spaces");
  });

  it("should handle AI generation error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      headers: new Map([["content-type", "image/jpeg"]]),
    });

    mockGenerateContent.mockRejectedValueOnce(new Error("AI Error"));

    const request = new NextRequest("http://localhost/api/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/image.jpg",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to generate article");
  });

  it("should use defaults for missing fields in AI response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      headers: new Map([["content-type", "image/jpeg"]]),
    });

    // Return response with missing optional fields
    const aiResponse = {
      title: "Title Only",
      slug: "title-only",
    };

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(aiResponse),
      },
    });

    const request = new NextRequest("http://localhost/api/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/image.jpg",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("Title Only");
    expect(data.category).toBe("技巧分享");
    expect(data.tags).toEqual([]);
    expect(data.content).toBe("");
    expect(data.excerpt).toBe("");
  });

  it("should use default content-type when not provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      headers: new Map(),
    });

    const aiResponse = {
      title: "Title",
      slug: "test",
      excerpt: "Excerpt",
      category: "技巧分享",
      tags: [],
      content: "Content",
    };

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(aiResponse),
      },
    });

    const request = new NextRequest("http://localhost/api/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/image.jpg",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it("should handle English prompt with custom text", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      headers: new Map([["content-type", "image/jpeg"]]),
    });

    const aiResponse = {
      title: "English Title",
      slug: "english-article",
      excerpt: "English excerpt",
      category: "Tips & Techniques",
      tags: ["english", "test"],
      content: "English content",
    };

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(aiResponse),
      },
    });

    const request = new NextRequest("http://localhost/api/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "https://example.com/image.jpg",
        prompt: "Write about landscapes",
        language: "en",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
