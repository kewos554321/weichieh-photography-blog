import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from "@/app/api/posts/route";

describe("Posts API", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/posts", () => {
    it("should return posts list with admin=true", async () => {
      const mockPosts = [
        { id: 1, slug: "post-1", title: "Post 1", tags: [] },
      ];
      mockPrisma.post.findMany.mockResolvedValue(mockPosts);
      mockPrisma.post.count.mockResolvedValue(1);

      const request = new NextRequest("http://localhost/api/posts?admin=true");
      const response = await GET(request);
      const data = await response.json();

      expect(data.posts).toEqual(mockPosts);
      expect(data.total).toBe(1);
    });

    it("should filter by status for public requests", async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);

      const request = new NextRequest("http://localhost/api/posts");
      await GET(request);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "published",
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  { publishedAt: null },
                  { publishedAt: expect.objectContaining({ lte: expect.any(Date) }) },
                ]),
              }),
            ]),
          }),
        })
      );
    });

    it("should filter by category", async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/posts?category=技巧分享&admin=true"
      );
      await GET(request);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: "技巧分享" }),
        })
      );
    });

    it("should not filter category when 全部 (admin mode)", async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/posts?category=全部&admin=true"
      );
      await GET(request);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it("should filter by tag", async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/posts?tag=Tutorial&admin=true"
      );
      await GET(request);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { some: { name: "Tutorial" } },
          }),
        })
      );
    });

    it("should filter by status query param", async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/posts?status=draft&admin=true"
      );
      await GET(request);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "draft" }),
        })
      );
    });

    it("should filter by search", async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/posts?search=photography&admin=true"
      );
      await GET(request);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
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
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/posts?limit=5&offset=10&admin=true"
      );
      await GET(request);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 10,
        })
      );
    });

    it("should handle errors", async () => {
      mockPrisma.post.findMany.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost/api/posts?admin=true");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch posts");
    });
  });

  describe("POST /api/posts", () => {
    const validPostData = {
      slug: "new-post",
      title: "New Post",
      excerpt: "A short description",
      content: "Full post content here that is long enough",
      cover: "https://example.com/cover.jpg",
      category: "技巧分享",
    };

    it("should create a new post", async () => {
      const mockPost = { id: 1, ...validPostData, readTime: 1, tags: [] };
      mockPrisma.post.findUnique.mockResolvedValue(null);
      mockPrisma.post.create.mockResolvedValue(mockPost);

      const request = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify(validPostData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockPost);
    });

    it("should create post with tags", async () => {
      const mockPost = { id: 1, ...validPostData, tags: [{ id: 1 }] };
      mockPrisma.post.findUnique.mockResolvedValue(null);
      mockPrisma.post.create.mockResolvedValue(mockPost);

      const request = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ ...validPostData, tagIds: [1, 2] }),
      });

      await POST(request);

      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: { connect: [{ id: 1 }, { id: 2 }] },
          }),
        })
      );
    });

    it("should create post with custom date", async () => {
      const mockPost = { id: 1, ...validPostData, tags: [] };
      mockPrisma.post.findUnique.mockResolvedValue(null);
      mockPrisma.post.create.mockResolvedValue(mockPost);

      const request = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ ...validPostData, date: "2024-06-15" }),
      });

      await POST(request);

      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: new Date("2024-06-15"),
          }),
        })
      );
    });

    it("should create post with status", async () => {
      const mockPost = { id: 1, ...validPostData, status: "published", tags: [] };
      mockPrisma.post.findUnique.mockResolvedValue(null);
      mockPrisma.post.create.mockResolvedValue(mockPost);

      const request = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ ...validPostData, status: "published" }),
      });

      await POST(request);

      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "published",
          }),
        })
      );
    });

    it("should create post with scheduled publishedAt", async () => {
      const publishedAt = "2025-06-15T10:00:00";
      const mockPost = { id: 1, ...validPostData, status: "scheduled", tags: [] };
      mockPrisma.post.findUnique.mockResolvedValue(null);
      mockPrisma.post.create.mockResolvedValue(mockPost);

      const request = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ ...validPostData, status: "scheduled", publishedAt }),
      });

      await POST(request);

      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "scheduled",
            publishedAt: new Date(publishedAt),
          }),
        })
      );
    });

    it("should calculate read time based on content length", async () => {
      const longContent = "a".repeat(900); // 900 chars = 3 min read
      const mockPost = { id: 1, readTime: 3, tags: [] };
      mockPrisma.post.findUnique.mockResolvedValue(null);
      mockPrisma.post.create.mockResolvedValue(mockPost);

      const request = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ ...validPostData, content: longContent }),
      });

      await POST(request);

      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            readTime: 3,
          }),
        })
      );
    });

    it("should return 400 if required fields are missing", async () => {
      const request = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ slug: "test" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
    });

    it("should return 409 if slug already exists", async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 1 });

      const request = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify(validPostData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Slug already exists");
    });

    it("should handle errors", async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      mockPrisma.post.create.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify(validPostData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create post");
    });
  });
});
