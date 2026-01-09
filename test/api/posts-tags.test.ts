import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from "@/app/api/posts/tags/route";

describe("Posts Tags API", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/posts/tags", () => {
    it("should return all post tags", async () => {
      const mockTags = [
        { id: 1, name: "Tutorial", _count: { posts: 5 } },
        { id: 2, name: "Travel", _count: { posts: 3 } },
      ];
      mockPrisma.postTag.findMany.mockResolvedValue(mockTags);

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual(mockTags);
      expect(mockPrisma.postTag.findMany).toHaveBeenCalledWith({
        orderBy: { name: "asc" },
        include: { _count: { select: { posts: true } } },
      });
    });

    it("should handle errors", async () => {
      mockPrisma.postTag.findMany.mockRejectedValue(new Error("DB error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch post tags");
    });
  });

  describe("POST /api/posts/tags", () => {
    it("should create a new tag", async () => {
      const mockTag = { id: 1, name: "NewTag" };
      mockPrisma.postTag.create.mockResolvedValue(mockTag);

      const request = new NextRequest("http://localhost/api/posts/tags", {
        method: "POST",
        body: JSON.stringify({ name: "NewTag" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockTag);
    });

    it("should trim tag name", async () => {
      const mockTag = { id: 1, name: "TrimmedTag" };
      mockPrisma.postTag.create.mockResolvedValue(mockTag);

      const request = new NextRequest("http://localhost/api/posts/tags", {
        method: "POST",
        body: JSON.stringify({ name: "  TrimmedTag  " }),
      });

      await POST(request);

      expect(mockPrisma.postTag.create).toHaveBeenCalledWith({
        data: { name: "TrimmedTag" },
      });
    });

    it("should return 400 if name is missing", async () => {
      const request = new NextRequest("http://localhost/api/posts/tags", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Tag name is required");
    });

    it("should return 400 if name is not a string", async () => {
      const request = new NextRequest("http://localhost/api/posts/tags", {
        method: "POST",
        body: JSON.stringify({ name: 123 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Tag name is required");
    });

    it("should return 409 if tag already exists", async () => {
      mockPrisma.postTag.create.mockRejectedValue({ code: "P2002" });

      const request = new NextRequest("http://localhost/api/posts/tags", {
        method: "POST",
        body: JSON.stringify({ name: "ExistingTag" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Tag already exists");
    });

    it("should handle other errors", async () => {
      mockPrisma.postTag.create.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost/api/posts/tags", {
        method: "POST",
        body: JSON.stringify({ name: "NewTag" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create post tag");
    });
  });
});
