import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Use vi.hoisted to ensure mocks are available before vi.mock
const { mockGenerateContent, mockGetGenerativeModel } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn();
  const mockGetGenerativeModel = vi.fn(() => ({
    generateContent: mockGenerateContent,
  }));
  return { mockGenerateContent, mockGetGenerativeModel };
});

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = mockGetGenerativeModel;
  },
}));

// Mock fetch for image download
const originalFetch = global.fetch;

import { POST } from "@/app/api/ai/generate-story/route";

describe("AI Generate Story API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-api-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const createRequest = (body: object) => {
    return new NextRequest("http://localhost/api/ai/generate-story", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  it("should return 400 if imageUrl is missing", async () => {
    const response = await POST(createRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing imageUrl");
  });

  it("should return 500 if GEMINI_API_KEY is not configured", async () => {
    delete process.env.GEMINI_API_KEY;

    const response = await POST(createRequest({ imageUrl: "https://example.com/image.jpg" }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("GEMINI_API_KEY is not configured");
  });

  it("should return 400 if image fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const response = await POST(createRequest({ imageUrl: "https://example.com/image.jpg" }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Failed to fetch image");
  });

  it("should generate story successfully with Chinese language", async () => {
    const mockImageBuffer = new ArrayBuffer(8);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: () => Promise.resolve(mockImageBuffer),
    });

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          title: "測試標題",
          story: "測試故事內容",
          category: "Landscape",
          tags: ["風景", "自然"],
        }),
      },
    });

    const response = await POST(createRequest({
      imageUrl: "https://example.com/image.jpg",
      language: "zh",
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.title).toBe("測試標題");
    expect(data.story).toBe("測試故事內容");
    expect(data.category).toBe("Landscape");
    expect(data.tags).toEqual(["風景", "自然"]);
  });

  it("should generate story successfully with English language", async () => {
    const mockImageBuffer = new ArrayBuffer(8);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/png" }),
      arrayBuffer: () => Promise.resolve(mockImageBuffer),
    });

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          title: "Test Title",
          story: "Test story content",
          category: "Portrait",
          tags: ["portrait", "people"],
        }),
      },
    });

    const response = await POST(createRequest({
      imageUrl: "https://example.com/image.png",
      language: "en",
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.title).toBe("Test Title");
    expect(data.category).toBe("Portrait");
  });

  it("should include custom prompt when provided", async () => {
    const mockImageBuffer = new ArrayBuffer(8);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: () => Promise.resolve(mockImageBuffer),
    });

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          title: "Custom Title",
          story: "Custom story",
          category: "Street",
          tags: [],
        }),
      },
    });

    const response = await POST(createRequest({
      imageUrl: "https://example.com/image.jpg",
      prompt: "focus on the lighting",
    }));

    expect(mockGenerateContent).toHaveBeenCalled();
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("should handle markdown code blocks in response", async () => {
    const mockImageBuffer = new ArrayBuffer(8);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: () => Promise.resolve(mockImageBuffer),
    });

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "```json\n" + JSON.stringify({
          title: "Wrapped Title",
          story: "Wrapped story",
          category: "Nature",
          tags: ["nature"],
        }) + "\n```",
      },
    });

    const response = await POST(createRequest({
      imageUrl: "https://example.com/image.jpg",
    }));
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.title).toBe("Wrapped Title");
  });

  it("should fallback when JSON parsing fails", async () => {
    const mockImageBuffer = new ArrayBuffer(8);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: () => Promise.resolve(mockImageBuffer),
    });

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "This is just plain text, not JSON",
      },
    });

    const response = await POST(createRequest({
      imageUrl: "https://example.com/image.jpg",
    }));
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.story).toBe("This is just plain text, not JSON");
    expect(data.title).toBe("");
    expect(data.category).toBe("Portrait");
    expect(data.tags).toEqual([]);
  });

  it("should handle API errors gracefully", async () => {
    const mockImageBuffer = new ArrayBuffer(8);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: () => Promise.resolve(mockImageBuffer),
    });

    mockGenerateContent.mockRejectedValue(new Error("API Error"));

    const response = await POST(createRequest({
      imageUrl: "https://example.com/image.jpg",
    }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to generate story");
  });
});
