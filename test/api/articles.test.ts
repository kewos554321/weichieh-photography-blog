import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from "@/app/api/articles/route";

describe("Articles API", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/articles", () => {
    it("should return articles list", async () => {
      const mockArticles = [
        { id: 1, slug: "article-1", title: "Article 1", tags: [] },
      ];
      mockPrisma.article.findMany.mockResolvedValue(mockArticles);
      mockPrisma.article.count.mockResolvedValue(1);

      const request = new NextRequest("http://localhost/api/articles");
      const response = await GET(request);
      const data = await response.json();

      expect(data.articles).toEqual(mockArticles);
      expect(data.total).toBe(1);
    });

    it("should filter by category", async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/articles?category=技巧分享"
      );
      await GET(request);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: "技巧分享" }),
        })
      );
    });

    it("should not filter when category is 全部", async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/articles?category=全部"
      );
      await GET(request);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it("should filter by tag", async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/articles?tag=Tutorial"
      );
      await GET(request);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { some: { name: "Tutorial" } },
          }),
        })
      );
    });

    it("should filter by published status", async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/articles?published=true"
      );
      await GET(request);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ published: true }),
        })
      );
    });

    it("should filter by search", async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/articles?search=photography"
      );
      await GET(request);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: "photography", mode: "insensitive" } },
              { excerpt: { contains: "photography", mode: "insensitive" } },
            ],
          }),
        })
      );
    });

    it("should respect limit and offset", async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/articles?limit=5&offset=10"
      );
      await GET(request);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 10,
        })
      );
    });

    it("should handle errors", async () => {
      mockPrisma.article.findMany.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost/api/articles");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch articles");
    });
  });

  describe("POST /api/articles", () => {
    const validArticleData = {
      slug: "new-article",
      title: "New Article",
      excerpt: "A short description",
      content: "Full article content here that is long enough",
      cover: "https://example.com/cover.jpg",
      category: "技巧分享",
    };

    it("should create a new article", async () => {
      const mockArticle = { id: 1, ...validArticleData, readTime: 1, tags: [] };
      mockPrisma.article.findUnique.mockResolvedValue(null);
      mockPrisma.article.create.mockResolvedValue(mockArticle);

      const request = new NextRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify(validArticleData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockArticle);
    });

    it("should create article with tags", async () => {
      const mockArticle = { id: 1, ...validArticleData, tags: [{ id: 1 }] };
      mockPrisma.article.findUnique.mockResolvedValue(null);
      mockPrisma.article.create.mockResolvedValue(mockArticle);

      const request = new NextRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify({ ...validArticleData, tagIds: [1, 2] }),
      });

      await POST(request);

      expect(mockPrisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: { connect: [{ id: 1 }, { id: 2 }] },
          }),
        })
      );
    });

    it("should create article with custom date", async () => {
      const mockArticle = { id: 1, ...validArticleData, tags: [] };
      mockPrisma.article.findUnique.mockResolvedValue(null);
      mockPrisma.article.create.mockResolvedValue(mockArticle);

      const request = new NextRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify({ ...validArticleData, date: "2024-06-15" }),
      });

      await POST(request);

      expect(mockPrisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: new Date("2024-06-15"),
          }),
        })
      );
    });

    it("should create article with published status", async () => {
      const mockArticle = { id: 1, ...validArticleData, published: true, tags: [] };
      mockPrisma.article.findUnique.mockResolvedValue(null);
      mockPrisma.article.create.mockResolvedValue(mockArticle);

      const request = new NextRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify({ ...validArticleData, published: true }),
      });

      await POST(request);

      expect(mockPrisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            published: true,
          }),
        })
      );
    });

    it("should calculate read time based on content length", async () => {
      const longContent = "a".repeat(900); // 900 chars = 3 min read
      const mockArticle = { id: 1, readTime: 3, tags: [] };
      mockPrisma.article.findUnique.mockResolvedValue(null);
      mockPrisma.article.create.mockResolvedValue(mockArticle);

      const request = new NextRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify({ ...validArticleData, content: longContent }),
      });

      await POST(request);

      expect(mockPrisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            readTime: 3,
          }),
        })
      );
    });

    it("should return 400 if required fields are missing", async () => {
      const request = new NextRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify({ slug: "test" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
    });

    it("should return 409 if slug already exists", async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ id: 1 });

      const request = new NextRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify(validArticleData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Slug already exists");
    });

    it("should handle errors", async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);
      mockPrisma.article.create.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify(validArticleData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create article");
    });
  });
});
