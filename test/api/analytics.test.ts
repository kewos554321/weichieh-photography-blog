import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET } from "@/app/api/analytics/route";
import { POST } from "@/app/api/analytics/track/route";

describe("Analytics API", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/analytics", () => {
    it("should return analytics data", async () => {
      mockPrisma.photo.count.mockResolvedValue(10);
      mockPrisma.article.count.mockResolvedValue(5);
      mockPrisma.photo.aggregate.mockResolvedValue({ _sum: { viewCount: 100 } });
      mockPrisma.article.aggregate.mockResolvedValue({ _sum: { viewCount: 50 } });
      mockPrisma.photo.findMany.mockResolvedValue([
        { id: 1, slug: "photo-1", title: "Photo 1", src: "/img.jpg", viewCount: 50, category: "Portrait" },
      ]);
      mockPrisma.article.findMany.mockResolvedValue([
        { id: 1, slug: "article-1", title: "Article 1", cover: "/cover.jpg", viewCount: 30, category: "Tips" },
      ]);
      mockPrisma.photo.groupBy.mockResolvedValue([
        { category: "Portrait", _count: { id: 5 }, _sum: { viewCount: 60 } },
      ]);
      mockPrisma.article.groupBy.mockResolvedValue([
        { category: "Tips", _count: { id: 3 }, _sum: { viewCount: 40 } },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.overview).toBeDefined();
      expect(data.overview.totalViews).toBe(150);
      expect(data.topPhotos).toHaveLength(1);
      expect(data.topArticles).toHaveLength(1);
      expect(data.photoCategoryStats).toHaveLength(1);
      expect(data.articleCategoryStats).toHaveLength(1);
    });

    it("should handle null view counts", async () => {
      mockPrisma.photo.count.mockResolvedValue(0);
      mockPrisma.article.count.mockResolvedValue(0);
      mockPrisma.photo.aggregate.mockResolvedValue({ _sum: { viewCount: null } });
      mockPrisma.article.aggregate.mockResolvedValue({ _sum: { viewCount: null } });
      mockPrisma.photo.findMany.mockResolvedValue([]);
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.photo.groupBy.mockResolvedValue([]);
      mockPrisma.article.groupBy.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.overview.totalViews).toBe(0);
      expect(data.overview.photoViews).toBe(0);
      expect(data.overview.articleViews).toBe(0);
    });

    it("should handle null viewCount in category stats", async () => {
      mockPrisma.photo.count.mockResolvedValue(5);
      mockPrisma.article.count.mockResolvedValue(3);
      mockPrisma.photo.aggregate.mockResolvedValue({ _sum: { viewCount: 0 } });
      mockPrisma.article.aggregate.mockResolvedValue({ _sum: { viewCount: 0 } });
      mockPrisma.photo.findMany.mockResolvedValue([]);
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.photo.groupBy.mockResolvedValue([
        { category: "Portrait", _count: { id: 5 }, _sum: { viewCount: null } },
      ]);
      mockPrisma.article.groupBy.mockResolvedValue([
        { category: "Tips", _count: { id: 3 }, _sum: { viewCount: null } },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.photoCategoryStats[0].views).toBe(0);
      expect(data.articleCategoryStats[0].views).toBe(0);
    });

    it("should handle errors", async () => {
      mockPrisma.photo.count.mockRejectedValue(new Error("DB error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to get analytics");
    });
  });

  describe("POST /api/analytics/track", () => {
    it("should track photo view", async () => {
      mockPrisma.photo.update.mockResolvedValue({ id: 1, viewCount: 1 });

      const request = new NextRequest("http://localhost/api/analytics/track", {
        method: "POST",
        body: JSON.stringify({ type: "photo", slug: "test-photo" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.photo.update).toHaveBeenCalledWith({
        where: { slug: "test-photo" },
        data: { viewCount: { increment: 1 } },
      });
    });

    it("should track article view", async () => {
      mockPrisma.article.update.mockResolvedValue({ id: 1, viewCount: 1 });

      const request = new NextRequest("http://localhost/api/analytics/track", {
        method: "POST",
        body: JSON.stringify({ type: "article", slug: "test-article" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { slug: "test-article" },
        data: { viewCount: { increment: 1 } },
      });
    });

    it("should return error for missing type or slug", async () => {
      const request = new NextRequest("http://localhost/api/analytics/track", {
        method: "POST",
        body: JSON.stringify({ type: "photo" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing type or slug");
    });

    it("should return error for invalid type", async () => {
      const request = new NextRequest("http://localhost/api/analytics/track", {
        method: "POST",
        body: JSON.stringify({ type: "invalid", slug: "test" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid type");
    });

    it("should handle errors", async () => {
      mockPrisma.photo.update.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost/api/analytics/track", {
        method: "POST",
        body: JSON.stringify({ type: "photo", slug: "test-photo" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to track view");
    });
  });
});
