import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from "@/app/api/cron/publish/route";

describe("Cron Publish API", () => {
  beforeEach(() => {
    resetMocks();
    delete process.env.CRON_SECRET;
  });

  it("should publish scheduled articles and photos", async () => {
    mockPrisma.article.updateMany.mockResolvedValue({ count: 2 });
    mockPrisma.photo.updateMany.mockResolvedValue({ count: 3 });

    const request = new NextRequest("http://localhost/api/cron/publish");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.publishedArticles).toBe(2);
    expect(data.publishedPhotos).toBe(3);
    expect(data.timestamp).toBeDefined();
  });

  it("should update articles with correct where clause", async () => {
    mockPrisma.article.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.photo.updateMany.mockResolvedValue({ count: 0 });

    const request = new NextRequest("http://localhost/api/cron/publish");
    await GET(request);

    expect(mockPrisma.article.updateMany).toHaveBeenCalledWith({
      where: {
        status: "scheduled",
        publishedAt: {
          lte: expect.any(Date),
        },
      },
      data: {
        status: "published",
      },
    });
  });

  it("should update photos with correct where clause", async () => {
    mockPrisma.article.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.photo.updateMany.mockResolvedValue({ count: 0 });

    const request = new NextRequest("http://localhost/api/cron/publish");
    await GET(request);

    expect(mockPrisma.photo.updateMany).toHaveBeenCalledWith({
      where: {
        status: "scheduled",
        publishedAt: {
          lte: expect.any(Date),
        },
      },
      data: {
        status: "published",
      },
    });
  });

  it("should reject unauthorized requests when CRON_SECRET is set", async () => {
    process.env.CRON_SECRET = "test-secret";
    mockPrisma.article.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.photo.updateMany.mockResolvedValue({ count: 0 });

    const request = new NextRequest("http://localhost/api/cron/publish");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should allow authorized requests with correct CRON_SECRET", async () => {
    process.env.CRON_SECRET = "test-secret";
    mockPrisma.article.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.photo.updateMany.mockResolvedValue({ count: 1 });

    const request = new NextRequest("http://localhost/api/cron/publish", {
      headers: {
        authorization: "Bearer test-secret",
      },
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should handle errors", async () => {
    mockPrisma.article.updateMany.mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost/api/cron/publish");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to publish scheduled content");
  });

  describe("POST /api/cron/publish", () => {
    it("should manually trigger publish and return message when content published", async () => {
      mockPrisma.article.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 3 });

      const request = new NextRequest("http://localhost/api/cron/publish", {
        method: "POST",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.publishedArticles).toBe(2);
      expect(data.publishedPhotos).toBe(3);
      expect(data.message).toBe("已發布 2 篇文章和 3 張照片");
    });

    it("should return no content message when nothing to publish", async () => {
      mockPrisma.article.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 0 });

      const request = new NextRequest("http://localhost/api/cron/publish", {
        method: "POST",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("目前沒有待發布的排程內容");
    });

    it("should handle POST errors", async () => {
      mockPrisma.article.updateMany.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost/api/cron/publish", {
        method: "POST",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to publish scheduled content");
    });
  });
});
