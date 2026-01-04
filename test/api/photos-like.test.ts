import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMocks } from "../mocks/prisma";

// Use vi.hoisted to ensure mocks are available before vi.mock
const { mockHashIP, mockGetClientIP } = vi.hoisted(() => ({
  mockHashIP: vi.fn(),
  mockGetClientIP: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  hashIP: mockHashIP,
  getClientIP: mockGetClientIP,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from "@/app/api/photos/[slug]/like/route";

describe("Photos [slug] Like API", () => {
  beforeEach(() => {
    resetMocks();
    mockHashIP.mockReset();
    mockGetClientIP.mockReset();

    mockGetClientIP.mockReturnValue("127.0.0.1");
    mockHashIP.mockReturnValue("abc123");
  });

  const createRequest = (method = "GET") => {
    return new Request("http://localhost/api/photos/test-photo/like", { method });
  };

  const createParams = (slug: string) => ({
    params: Promise.resolve({ slug }),
  });

  describe("GET /api/photos/[slug]/like", () => {
    it("should return like status and count when not liked", async () => {
      const mockPhoto = { id: 1, likeCount: 10 };
      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);
      mockPrisma.like.findUnique.mockResolvedValue(null);

      const response = await GET(createRequest(), createParams("test-photo"));
      const data = await response.json();

      expect(data.liked).toBe(false);
      expect(data.likeCount).toBe(10);
    });

    it("should return like status and count when liked", async () => {
      const mockPhoto = { id: 1, likeCount: 10 };
      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);
      mockPrisma.like.findUnique.mockResolvedValue({ id: 1, photoId: 1, ipHash: "abc123" });

      const response = await GET(createRequest(), createParams("test-photo"));
      const data = await response.json();

      expect(data.liked).toBe(true);
      expect(data.likeCount).toBe(10);
    });

    it("should return 404 if photo not found", async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(null);

      const response = await GET(createRequest(), createParams("nonexistent"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Photo not found");
    });

    it("should handle errors", async () => {
      mockPrisma.photo.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await GET(createRequest(), createParams("test-photo"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to get like status");
    });
  });

  describe("POST /api/photos/[slug]/like", () => {
    it("should like a photo when not already liked", async () => {
      const mockPhoto = { id: 1, likeCount: 10 };
      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);
      mockPrisma.like.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const response = await POST(createRequest("POST"), createParams("test-photo"));
      const data = await response.json();

      expect(data.liked).toBe(true);
      expect(data.likeCount).toBe(11);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should unlike a photo when already liked", async () => {
      const mockPhoto = { id: 1, likeCount: 10 };
      const mockLike = { id: 1, photoId: 1, ipHash: "abc123" };
      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);
      mockPrisma.like.findUnique.mockResolvedValue(mockLike);
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const response = await POST(createRequest("POST"), createParams("test-photo"));
      const data = await response.json();

      expect(data.liked).toBe(false);
      expect(data.likeCount).toBe(9);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should return 404 if photo not found", async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(null);

      const response = await POST(createRequest("POST"), createParams("nonexistent"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Photo not found");
    });

    it("should handle errors", async () => {
      mockPrisma.photo.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await POST(createRequest("POST"), createParams("test-photo"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to toggle like");
    });
  });
});
