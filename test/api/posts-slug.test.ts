import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

// Use vi.hoisted to ensure mocks are available before vi.mock
const { mockSend, MockS3Client, MockDeleteObjectCommand, mockGenerateUniquePostSlug } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const mockGenerateUniquePostSlug = vi.fn();
  return {
    mockSend,
    mockGenerateUniquePostSlug,
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
  generateUniquePostSlug: mockGenerateUniquePostSlug,
}));

import { GET, PUT, DELETE } from "@/app/api/posts/[slug]/route";

describe("Posts [slug] API", () => {
  beforeEach(() => {
    resetMocks();
    mockSend.mockReset();
    mockGenerateUniquePostSlug.mockReset();
  });

  const createRequest = (slug: string, method = "GET", body?: object) => {
    return new NextRequest(`http://localhost/api/posts/${slug}`, {
      method,
      ...(body && { body: JSON.stringify(body) }),
    });
  };

  const createParams = (slug: string) => ({
    params: Promise.resolve({ slug }),
  });

  describe("GET /api/posts/[slug]", () => {
    it("should return a published post", async () => {
      const mockPost = {
        id: 1,
        slug: "test-post",
        title: "Test Post",
        status: "published",
        publishedAt: null,
        tags: [],
      };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      const response = await GET(
        createRequest("test-post"),
        createParams("test-post")
      );
      const data = await response.json();

      expect(data).toEqual(mockPost);
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { slug: "test-post" },
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

    it("should return 404 for unpublished post without admin", async () => {
      const mockPost = {
        id: 1,
        slug: "test-post",
        status: "draft",
        publishedAt: null,
        tags: [],
      };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      const response = await GET(
        createRequest("test-post"),
        createParams("test-post")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Post not found");
    });

    it("should return unpublished post with admin=true", async () => {
      const mockPost = {
        id: 1,
        slug: "test-post",
        status: "draft",
        publishedAt: null,
        tags: [],
      };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      const response = await GET(
        new NextRequest("http://localhost/api/posts/test-post?admin=true"),
        createParams("test-post")
      );
      const data = await response.json();

      expect(data).toEqual(mockPost);
    });

    it("should return 404 for scheduled post not yet due", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const mockPost = {
        id: 1,
        slug: "test-post",
        status: "published",
        publishedAt: futureDate,
        tags: [],
      };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      const response = await GET(
        createRequest("test-post"),
        createParams("test-post")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Post not found");
    });

    it("should return 404 if post not found", async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      const response = await GET(
        createRequest("nonexistent"),
        createParams("nonexistent")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Post not found");
    });

    it("should handle errors", async () => {
      mockPrisma.post.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await GET(
        createRequest("test-post"),
        createParams("test-post")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch post");
    });
  });

  describe("PUT /api/posts/[slug]", () => {
    const mockCurrentPost = { title: "Original Title" };

    it("should update an post", async () => {
      const mockPost = { id: 1, slug: "test-post", title: "Updated Title" };
      mockPrisma.post.findUnique.mockResolvedValue(mockCurrentPost);
      mockPrisma.post.update.mockResolvedValue(mockPost);
      mockGenerateUniquePostSlug.mockResolvedValue("updated-title");

      const response = await PUT(
        createRequest("test-post", "PUT", { title: "Updated Title" }),
        createParams("test-post")
      );
      const data = await response.json();

      expect(data).toEqual(mockPost);
    });

    it("should regenerate slug when title changes", async () => {
      const mockPost = { id: 1, slug: "new-title", title: "New Title" };
      mockPrisma.post.findUnique.mockResolvedValue(mockCurrentPost);
      mockPrisma.post.update.mockResolvedValue(mockPost);
      mockGenerateUniquePostSlug.mockResolvedValue("new-title");

      await PUT(
        createRequest("test-post", "PUT", { title: "New Title" }),
        createParams("test-post")
      );

      expect(mockGenerateUniquePostSlug).toHaveBeenCalledWith("New Title", "test-post");
      expect(mockPrisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: "new-title",
          }),
        })
      );
    });

    it("should not regenerate slug when title unchanged", async () => {
      const mockPost = { id: 1, slug: "test-post", title: "Original Title" };
      mockPrisma.post.findUnique.mockResolvedValue(mockCurrentPost);
      mockPrisma.post.update.mockResolvedValue(mockPost);

      await PUT(
        createRequest("test-post", "PUT", { title: "Original Title" }),
        createParams("test-post")
      );

      expect(mockGenerateUniquePostSlug).not.toHaveBeenCalled();
    });

    it("should return 404 if post not found", async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      const response = await PUT(
        createRequest("nonexistent", "PUT", { title: "Test" }),
        createParams("nonexistent")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Post not found");
    });

    it("should update post with new cover", async () => {
      const mockPost = { id: 1, slug: "test-post", cover: "https://new.com/cover.jpg" };
      mockPrisma.post.findUnique.mockResolvedValue(mockCurrentPost);
      mockPrisma.post.update.mockResolvedValue(mockPost);

      await PUT(
        createRequest("test-post", "PUT", { cover: "https://new.com/cover.jpg" }),
        createParams("test-post")
      );

      expect(mockPrisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cover: "https://new.com/cover.jpg" }),
        })
      );
    });

    it("should update post with tags", async () => {
      const mockPost = { id: 1, slug: "test-post", tags: [{ id: 1 }] };
      mockPrisma.post.findUnique.mockResolvedValue(mockCurrentPost);
      mockPrisma.post.update.mockResolvedValue(mockPost);

      await PUT(
        createRequest("test-post", "PUT", { tagIds: [1, 2] }),
        createParams("test-post")
      );

      expect(mockPrisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: { set: [{ id: 1 }, { id: 2 }] },
          }),
        })
      );
    });

    it("should recalculate read time when content changes", async () => {
      const longContent = "a".repeat(600); // 600 chars = 2 min read
      const mockPost = { id: 1, slug: "test-post", readTime: 2 };
      mockPrisma.post.findUnique.mockResolvedValue(mockCurrentPost);
      mockPrisma.post.update.mockResolvedValue(mockPost);

      await PUT(
        createRequest("test-post", "PUT", { content: longContent }),
        createParams("test-post")
      );

      expect(mockPrisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ readTime: 2 }),
        })
      );
    });

    it("should update date when provided", async () => {
      const mockPost = { id: 1, slug: "test-post" };
      mockPrisma.post.findUnique.mockResolvedValue(mockCurrentPost);
      mockPrisma.post.update.mockResolvedValue(mockPost);

      await PUT(
        createRequest("test-post", "PUT", { date: "2024-06-15" }),
        createParams("test-post")
      );

      expect(mockPrisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: new Date("2024-06-15"),
          }),
        })
      );
    });

    it("should not update date when not provided", async () => {
      const mockPost = { id: 1, slug: "test-post" };
      mockPrisma.post.findUnique.mockResolvedValue(mockCurrentPost);
      mockPrisma.post.update.mockResolvedValue(mockPost);

      await PUT(
        createRequest("test-post", "PUT", { excerpt: "Test excerpt" }),
        createParams("test-post")
      );

      expect(mockPrisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: undefined,
          }),
        })
      );
    });

    it("should update status", async () => {
      const mockPost = { id: 1, slug: "test-post", status: "published" };
      mockPrisma.post.findUnique.mockResolvedValue(mockCurrentPost);
      mockPrisma.post.update.mockResolvedValue(mockPost);

      await PUT(
        createRequest("test-post", "PUT", { status: "published" }),
        createParams("test-post")
      );

      expect(mockPrisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "published",
          }),
        })
      );
    });

    it("should update publishedAt", async () => {
      const publishedAt = "2025-06-15T10:00:00";
      const mockPost = { id: 1, slug: "test-post", publishedAt: new Date(publishedAt) };
      mockPrisma.post.findUnique.mockResolvedValue(mockCurrentPost);
      mockPrisma.post.update.mockResolvedValue(mockPost);

      await PUT(
        createRequest("test-post", "PUT", { publishedAt }),
        createParams("test-post")
      );

      expect(mockPrisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: new Date(publishedAt),
          }),
        })
      );
    });

    it("should clear publishedAt when set to null", async () => {
      const mockPost = { id: 1, slug: "test-post", publishedAt: null };
      mockPrisma.post.findUnique.mockResolvedValue(mockCurrentPost);
      mockPrisma.post.update.mockResolvedValue(mockPost);

      await PUT(
        createRequest("test-post", "PUT", { publishedAt: null }),
        createParams("test-post")
      );

      expect(mockPrisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: null,
          }),
        })
      );
    });

    it("should handle errors", async () => {
      mockPrisma.post.findUnique.mockResolvedValue(mockCurrentPost);
      mockPrisma.post.update.mockRejectedValue(new Error("DB error"));

      const response = await PUT(
        createRequest("test-post", "PUT", { excerpt: "Test" }),
        createParams("test-post")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update post");
    });
  });

  describe("DELETE /api/posts/[slug]", () => {
    const R2_PUBLIC_URL = "https://test.r2.dev";

    beforeEach(() => {
      process.env.R2_PUBLIC_URL = R2_PUBLIC_URL;
    });

    it("should delete an post and R2 file", async () => {
      const mockPost = {
        id: 1,
        slug: "test-post",
        cover: `${R2_PUBLIC_URL}/posts/cover.jpg`,
      };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.post.delete.mockResolvedValue(mockPost);
      mockSend.mockResolvedValue({});

      const response = await DELETE(
        createRequest("test-post", "DELETE"),
        createParams("test-post")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockSend).toHaveBeenCalled();
      expect(mockPrisma.post.delete).toHaveBeenCalledWith({
        where: { slug: "test-post" },
      });
    });

    it("should skip R2 deletion if URL doesn't match", async () => {
      const mockPost = {
        id: 1,
        slug: "test-post",
        cover: "https://other.com/cover.jpg",
      };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.post.delete.mockResolvedValue(mockPost);

      const response = await DELETE(
        createRequest("test-post", "DELETE"),
        createParams("test-post")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should continue deletion even if R2 fails", async () => {
      const mockPost = {
        id: 1,
        slug: "test-post",
        cover: `${R2_PUBLIC_URL}/posts/cover.jpg`,
      };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.post.delete.mockResolvedValue(mockPost);
      mockSend.mockRejectedValue(new Error("R2 error"));

      const response = await DELETE(
        createRequest("test-post", "DELETE"),
        createParams("test-post")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockPrisma.post.delete).toHaveBeenCalled();
    });

    it("should return 404 if post not found", async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      const response = await DELETE(
        createRequest("nonexistent", "DELETE"),
        createParams("nonexistent")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Post not found");
    });

    it("should handle errors", async () => {
      mockPrisma.post.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await DELETE(
        createRequest("test-post", "DELETE"),
        createParams("test-post")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete post");
    });
  });
});
