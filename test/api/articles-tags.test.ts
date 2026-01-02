import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from "@/app/api/articles/tags/route";

describe("Articles Tags API", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/articles/tags", () => {
    it("should return all article tags", async () => {
      const mockTags = [
        { id: 1, name: "Tutorial", _count: { articles: 5 } },
        { id: 2, name: "Travel", _count: { articles: 3 } },
      ];
      mockPrisma.articleTag.findMany.mockResolvedValue(mockTags);

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual(mockTags);
      expect(mockPrisma.articleTag.findMany).toHaveBeenCalledWith({
        orderBy: { name: "asc" },
        include: { _count: { select: { articles: true } } },
      });
    });

    it("should handle errors", async () => {
      mockPrisma.articleTag.findMany.mockRejectedValue(new Error("DB error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch article tags");
    });
  });

  describe("POST /api/articles/tags", () => {
    it("should create a new tag", async () => {
      const mockTag = { id: 1, name: "NewTag" };
      mockPrisma.articleTag.create.mockResolvedValue(mockTag);

      const request = new NextRequest("http://localhost/api/articles/tags", {
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
      mockPrisma.articleTag.create.mockResolvedValue(mockTag);

      const request = new NextRequest("http://localhost/api/articles/tags", {
        method: "POST",
        body: JSON.stringify({ name: "  TrimmedTag  " }),
      });

      await POST(request);

      expect(mockPrisma.articleTag.create).toHaveBeenCalledWith({
        data: { name: "TrimmedTag" },
      });
    });

    it("should return 400 if name is missing", async () => {
      const request = new NextRequest("http://localhost/api/articles/tags", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Tag name is required");
    });

    it("should return 400 if name is not a string", async () => {
      const request = new NextRequest("http://localhost/api/articles/tags", {
        method: "POST",
        body: JSON.stringify({ name: 123 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Tag name is required");
    });

    it("should return 409 if tag already exists", async () => {
      mockPrisma.articleTag.create.mockRejectedValue({ code: "P2002" });

      const request = new NextRequest("http://localhost/api/articles/tags", {
        method: "POST",
        body: JSON.stringify({ name: "ExistingTag" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Tag already exists");
    });

    it("should handle other errors", async () => {
      mockPrisma.articleTag.create.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost/api/articles/tags", {
        method: "POST",
        body: JSON.stringify({ name: "NewTag" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create article tag");
    });
  });
});
