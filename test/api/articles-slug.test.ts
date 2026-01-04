import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

// Use vi.hoisted to ensure mocks are available before vi.mock
const { mockSend, MockS3Client, MockDeleteObjectCommand, mockGenerateUniqueArticleSlug } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const mockGenerateUniqueArticleSlug = vi.fn();
  return {
    mockSend,
    mockGenerateUniqueArticleSlug,
    MockS3Client: class {
      send = mockSend;
    },
    MockDeleteObjectCommand: class {
      constructor(public params: unknown) {}
    },
  };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: MockS3Client,
  DeleteObjectCommand: MockDeleteObjectCommand,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/slug", () => ({
  generateUniqueArticleSlug: mockGenerateUniqueArticleSlug,
}));

import { GET, PUT, DELETE } from "@/app/api/articles/[slug]/route";

describe("Articles [slug] API", () => {
  beforeEach(() => {
    resetMocks();
    mockSend.mockReset();
    mockGenerateUniqueArticleSlug.mockReset();
  });

  const createRequest = (slug: string, method = "GET", body?: object) => {
    return new NextRequest(`http://localhost/api/articles/${slug}`, {
      method,
      ...(body && { body: JSON.stringify(body) }),
    });
  };

  const createParams = (slug: string) => ({
    params: Promise.resolve({ slug }),
  });

  describe("GET /api/articles/[slug]", () => {
    it("should return a published article", async () => {
      const mockArticle = {
        id: 1,
        slug: "test-article",
        title: "Test Article",
        status: "published",
        publishedAt: null,
        tags: [],
      };
      mockPrisma.article.findUnique.mockResolvedValue(mockArticle);

      const response = await GET(
        createRequest("test-article"),
        createParams("test-article")
      );
      const data = await response.json();

      expect(data).toEqual(mockArticle);
      expect(mockPrisma.article.findUnique).toHaveBeenCalledWith({
        where: { slug: "test-article" },
        include: {
          tags: true,
          photos: {
            where: { status: "published" },
            select: {
              id: true,
              slug: true,
              title: true,
              src: true,
              location: true,
            },
            orderBy: { date: "desc" },
          },
        },
      });
    });

    it("should return 404 for unpublished article without admin", async () => {
      const mockArticle = {
        id: 1,
        slug: "test-article",
        status: "draft",
        publishedAt: null,
        tags: [],
      };
      mockPrisma.article.findUnique.mockResolvedValue(mockArticle);

      const response = await GET(
        createRequest("test-article"),
        createParams("test-article")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Article not found");
    });

    it("should return unpublished article with admin=true", async () => {
      const mockArticle = {
        id: 1,
        slug: "test-article",
        status: "draft",
        publishedAt: null,
        tags: [],
      };
      mockPrisma.article.findUnique.mockResolvedValue(mockArticle);

      const response = await GET(
        new NextRequest("http://localhost/api/articles/test-article?admin=true"),
        createParams("test-article")
      );
      const data = await response.json();

      expect(data).toEqual(mockArticle);
    });

    it("should return 404 for scheduled article not yet due", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const mockArticle = {
        id: 1,
        slug: "test-article",
        status: "published",
        publishedAt: futureDate,
        tags: [],
      };
      mockPrisma.article.findUnique.mockResolvedValue(mockArticle);

      const response = await GET(
        createRequest("test-article"),
        createParams("test-article")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Article not found");
    });

    it("should return 404 if article not found", async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const response = await GET(
        createRequest("nonexistent"),
        createParams("nonexistent")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Article not found");
    });

    it("should handle errors", async () => {
      mockPrisma.article.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await GET(
        createRequest("test-article"),
        createParams("test-article")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch article");
    });
  });

  describe("PUT /api/articles/[slug]", () => {
    const mockCurrentArticle = { title: "Original Title" };

    it("should update an article", async () => {
      const mockArticle = { id: 1, slug: "test-article", title: "Updated Title" };
      mockPrisma.article.findUnique.mockResolvedValue(mockCurrentArticle);
      mockPrisma.article.update.mockResolvedValue(mockArticle);
      mockGenerateUniqueArticleSlug.mockResolvedValue("updated-title");

      const response = await PUT(
        createRequest("test-article", "PUT", { title: "Updated Title" }),
        createParams("test-article")
      );
      const data = await response.json();

      expect(data).toEqual(mockArticle);
    });

    it("should regenerate slug when title changes", async () => {
      const mockArticle = { id: 1, slug: "new-title", title: "New Title" };
      mockPrisma.article.findUnique.mockResolvedValue(mockCurrentArticle);
      mockPrisma.article.update.mockResolvedValue(mockArticle);
      mockGenerateUniqueArticleSlug.mockResolvedValue("new-title");

      await PUT(
        createRequest("test-article", "PUT", { title: "New Title" }),
        createParams("test-article")
      );

      expect(mockGenerateUniqueArticleSlug).toHaveBeenCalledWith("New Title", "test-article");
      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: "new-title",
          }),
        })
      );
    });

    it("should not regenerate slug when title unchanged", async () => {
      const mockArticle = { id: 1, slug: "test-article", title: "Original Title" };
      mockPrisma.article.findUnique.mockResolvedValue(mockCurrentArticle);
      mockPrisma.article.update.mockResolvedValue(mockArticle);

      await PUT(
        createRequest("test-article", "PUT", { title: "Original Title" }),
        createParams("test-article")
      );

      expect(mockGenerateUniqueArticleSlug).not.toHaveBeenCalled();
    });

    it("should return 404 if article not found", async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const response = await PUT(
        createRequest("nonexistent", "PUT", { title: "Test" }),
        createParams("nonexistent")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Article not found");
    });

    it("should update article with new cover", async () => {
      const mockArticle = { id: 1, slug: "test-article", cover: "https://new.com/cover.jpg" };
      mockPrisma.article.findUnique.mockResolvedValue(mockCurrentArticle);
      mockPrisma.article.update.mockResolvedValue(mockArticle);

      await PUT(
        createRequest("test-article", "PUT", { cover: "https://new.com/cover.jpg" }),
        createParams("test-article")
      );

      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cover: "https://new.com/cover.jpg" }),
        })
      );
    });

    it("should update article with tags", async () => {
      const mockArticle = { id: 1, slug: "test-article", tags: [{ id: 1 }] };
      mockPrisma.article.findUnique.mockResolvedValue(mockCurrentArticle);
      mockPrisma.article.update.mockResolvedValue(mockArticle);

      await PUT(
        createRequest("test-article", "PUT", { tagIds: [1, 2] }),
        createParams("test-article")
      );

      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: { set: [{ id: 1 }, { id: 2 }] },
          }),
        })
      );
    });

    it("should recalculate read time when content changes", async () => {
      const longContent = "a".repeat(600); // 600 chars = 2 min read
      const mockArticle = { id: 1, slug: "test-article", readTime: 2 };
      mockPrisma.article.findUnique.mockResolvedValue(mockCurrentArticle);
      mockPrisma.article.update.mockResolvedValue(mockArticle);

      await PUT(
        createRequest("test-article", "PUT", { content: longContent }),
        createParams("test-article")
      );

      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ readTime: 2 }),
        })
      );
    });

    it("should update date when provided", async () => {
      const mockArticle = { id: 1, slug: "test-article" };
      mockPrisma.article.findUnique.mockResolvedValue(mockCurrentArticle);
      mockPrisma.article.update.mockResolvedValue(mockArticle);

      await PUT(
        createRequest("test-article", "PUT", { date: "2024-06-15" }),
        createParams("test-article")
      );

      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: new Date("2024-06-15"),
          }),
        })
      );
    });

    it("should not update date when not provided", async () => {
      const mockArticle = { id: 1, slug: "test-article" };
      mockPrisma.article.findUnique.mockResolvedValue(mockCurrentArticle);
      mockPrisma.article.update.mockResolvedValue(mockArticle);

      await PUT(
        createRequest("test-article", "PUT", { excerpt: "Test excerpt" }),
        createParams("test-article")
      );

      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: undefined,
          }),
        })
      );
    });

    it("should update status", async () => {
      const mockArticle = { id: 1, slug: "test-article", status: "published" };
      mockPrisma.article.findUnique.mockResolvedValue(mockCurrentArticle);
      mockPrisma.article.update.mockResolvedValue(mockArticle);

      await PUT(
        createRequest("test-article", "PUT", { status: "published" }),
        createParams("test-article")
      );

      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "published",
          }),
        })
      );
    });

    it("should update publishedAt", async () => {
      const publishedAt = "2025-06-15T10:00:00";
      const mockArticle = { id: 1, slug: "test-article", publishedAt: new Date(publishedAt) };
      mockPrisma.article.findUnique.mockResolvedValue(mockCurrentArticle);
      mockPrisma.article.update.mockResolvedValue(mockArticle);

      await PUT(
        createRequest("test-article", "PUT", { publishedAt }),
        createParams("test-article")
      );

      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: new Date(publishedAt),
          }),
        })
      );
    });

    it("should clear publishedAt when set to null", async () => {
      const mockArticle = { id: 1, slug: "test-article", publishedAt: null };
      mockPrisma.article.findUnique.mockResolvedValue(mockCurrentArticle);
      mockPrisma.article.update.mockResolvedValue(mockArticle);

      await PUT(
        createRequest("test-article", "PUT", { publishedAt: null }),
        createParams("test-article")
      );

      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: null,
          }),
        })
      );
    });

    it("should handle errors", async () => {
      mockPrisma.article.findUnique.mockResolvedValue(mockCurrentArticle);
      mockPrisma.article.update.mockRejectedValue(new Error("DB error"));

      const response = await PUT(
        createRequest("test-article", "PUT", { excerpt: "Test" }),
        createParams("test-article")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update article");
    });
  });

  describe("DELETE /api/articles/[slug]", () => {
    const R2_PUBLIC_URL = "https://test.r2.dev";

    beforeEach(() => {
      process.env.R2_PUBLIC_URL = R2_PUBLIC_URL;
    });

    it("should delete an article and R2 file", async () => {
      const mockArticle = {
        id: 1,
        slug: "test-article",
        cover: `${R2_PUBLIC_URL}/articles/cover.jpg`,
      };
      mockPrisma.article.findUnique.mockResolvedValue(mockArticle);
      mockPrisma.article.delete.mockResolvedValue(mockArticle);
      mockSend.mockResolvedValue({});

      const response = await DELETE(
        createRequest("test-article", "DELETE"),
        createParams("test-article")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockSend).toHaveBeenCalled();
      expect(mockPrisma.article.delete).toHaveBeenCalledWith({
        where: { slug: "test-article" },
      });
    });

    it("should skip R2 deletion if URL doesn't match", async () => {
      const mockArticle = {
        id: 1,
        slug: "test-article",
        cover: "https://other.com/cover.jpg",
      };
      mockPrisma.article.findUnique.mockResolvedValue(mockArticle);
      mockPrisma.article.delete.mockResolvedValue(mockArticle);

      const response = await DELETE(
        createRequest("test-article", "DELETE"),
        createParams("test-article")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should continue deletion even if R2 fails", async () => {
      const mockArticle = {
        id: 1,
        slug: "test-article",
        cover: `${R2_PUBLIC_URL}/articles/cover.jpg`,
      };
      mockPrisma.article.findUnique.mockResolvedValue(mockArticle);
      mockPrisma.article.delete.mockResolvedValue(mockArticle);
      mockSend.mockRejectedValue(new Error("R2 error"));

      const response = await DELETE(
        createRequest("test-article", "DELETE"),
        createParams("test-article")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockPrisma.article.delete).toHaveBeenCalled();
    });

    it("should return 404 if article not found", async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const response = await DELETE(
        createRequest("nonexistent", "DELETE"),
        createParams("nonexistent")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Article not found");
    });

    it("should handle errors", async () => {
      mockPrisma.article.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await DELETE(
        createRequest("test-article", "DELETE"),
        createParams("test-article")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete article");
    });
  });
});
