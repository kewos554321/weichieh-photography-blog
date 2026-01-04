import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMocks } from "../mocks/prisma";

// Use vi.hoisted to ensure mocks are available before vi.mock
const { mockIsRateLimited, mockHashIP, mockGetClientIP } = vi.hoisted(() => ({
  mockIsRateLimited: vi.fn(),
  mockHashIP: vi.fn(),
  mockGetClientIP: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  isRateLimited: mockIsRateLimited,
  hashIP: mockHashIP,
  getClientIP: mockGetClientIP,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from "@/app/api/comments/route";

describe("Comments API", () => {
  beforeEach(() => {
    resetMocks();
    mockIsRateLimited.mockReset();
    mockHashIP.mockReset();
    mockGetClientIP.mockReset();

    // Default mocks
    mockGetClientIP.mockReturnValue("127.0.0.1");
    mockHashIP.mockReturnValue("abc123");
    mockIsRateLimited.mockReturnValue({ limited: false, remaining: 4, resetAt: Date.now() + 3600000 });
  });

  describe("GET /api/comments", () => {
    it("should return comments list with pagination", async () => {
      const mockComments = [
        { id: 1, name: "User", content: "Comment", photo: null, article: null },
      ];
      mockPrisma.comment.findMany.mockResolvedValue(mockComments);
      mockPrisma.comment.count.mockResolvedValue(1);

      const request = new Request("http://localhost/api/comments");
      const response = await GET(request);
      const data = await response.json();

      expect(data.comments).toEqual(mockComments);
      expect(data.total).toBe(1);
      expect(data.page).toBe(1);
      expect(data.totalPages).toBe(1);
    });

    it("should filter by status", async () => {
      mockPrisma.comment.findMany.mockResolvedValue([]);
      mockPrisma.comment.count.mockResolvedValue(0);

      const request = new Request("http://localhost/api/comments?status=PENDING");
      await GET(request);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "PENDING" }),
        })
      );
    });

    it("should filter by APPROVED status", async () => {
      mockPrisma.comment.findMany.mockResolvedValue([]);
      mockPrisma.comment.count.mockResolvedValue(0);

      const request = new Request("http://localhost/api/comments?status=APPROVED");
      await GET(request);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "APPROVED" }),
        })
      );
    });

    it("should filter by REJECTED status", async () => {
      mockPrisma.comment.findMany.mockResolvedValue([]);
      mockPrisma.comment.count.mockResolvedValue(0);

      const request = new Request("http://localhost/api/comments?status=REJECTED");
      await GET(request);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "REJECTED" }),
        })
      );
    });

    it("should filter by photoId", async () => {
      mockPrisma.comment.findMany.mockResolvedValue([]);
      mockPrisma.comment.count.mockResolvedValue(0);

      const request = new Request("http://localhost/api/comments?photoId=5");
      await GET(request);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ photoId: 5 }),
        })
      );
    });

    it("should filter by articleId", async () => {
      mockPrisma.comment.findMany.mockResolvedValue([]);
      mockPrisma.comment.count.mockResolvedValue(0);

      const request = new Request("http://localhost/api/comments?articleId=3");
      await GET(request);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ articleId: 3 }),
        })
      );
    });

    it("should handle pagination", async () => {
      mockPrisma.comment.findMany.mockResolvedValue([]);
      mockPrisma.comment.count.mockResolvedValue(100);

      const request = new Request("http://localhost/api/comments?page=3&limit=10");
      const response = await GET(request);
      const data = await response.json();

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
      expect(data.totalPages).toBe(10);
    });

    it("should handle errors", async () => {
      mockPrisma.comment.findMany.mockRejectedValue(new Error("DB error"));

      const request = new Request("http://localhost/api/comments");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch comments");
    });
  });

  describe("POST /api/comments", () => {
    it("should create a comment", async () => {
      const mockComment = {
        id: 1,
        name: "Test User",
        content: "Test comment",
        photoId: 1,
        articleId: null,
        ipHash: "abc123",
        status: "PENDING",
      };
      mockPrisma.comment.create.mockResolvedValue(mockComment);

      const request = new Request("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          content: "Test comment",
          photoId: "1",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockComment);
    });

    it("should create a comment for an article", async () => {
      const mockComment = {
        id: 1,
        name: "Test User",
        content: "Test comment",
        photoId: null,
        articleId: 2,
        ipHash: "abc123",
        status: "PENDING",
      };
      mockPrisma.comment.create.mockResolvedValue(mockComment);

      const request = new Request("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          content: "Test comment",
          articleId: "2",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          articleId: 2,
          photoId: null,
        }),
      });
    });

    it("should return 429 if rate limited", async () => {
      mockIsRateLimited.mockReturnValue({
        limited: true,
        remaining: 0,
        resetAt: Date.now() + 3600000,
      });

      const request = new Request("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          content: "Comment",
          photoId: "1",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("留言次數已達上限，請稍後再試");
    });

    it("should return 400 if name is missing", async () => {
      const request = new Request("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          content: "Comment",
          photoId: "1",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("請填寫名稱");
    });

    it("should return 400 if name is empty string", async () => {
      const request = new Request("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          name: "   ",
          content: "Comment",
          photoId: "1",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("請填寫名稱");
    });

    it("should return 400 if content is missing", async () => {
      const request = new Request("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          photoId: "1",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("請填寫留言內容");
    });

    it("should return 400 if content is empty string", async () => {
      const request = new Request("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          content: "   ",
          photoId: "1",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("請填寫留言內容");
    });

    it("should return 400 if content exceeds 1000 characters", async () => {
      const request = new Request("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          content: "a".repeat(1001),
          photoId: "1",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("留言內容不得超過 1000 字");
    });

    it("should return 400 if neither photoId nor articleId provided", async () => {
      const request = new Request("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          content: "Comment",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("請指定照片或文章");
    });

    it("should trim and limit name to 50 characters", async () => {
      mockPrisma.comment.create.mockResolvedValue({ id: 1 });

      const longName = "a".repeat(60);
      const request = new Request("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          name: `  ${longName}  `,
          content: "Comment",
          photoId: "1",
        }),
      });

      await POST(request);

      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "a".repeat(50),
        }),
      });
    });

    it("should handle errors", async () => {
      mockPrisma.comment.create.mockRejectedValue(new Error("DB error"));

      const request = new Request("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          content: "Comment",
          photoId: "1",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("留言失敗，請稍後再試");
    });
  });
});
