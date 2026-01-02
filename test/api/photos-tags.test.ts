import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from "@/app/api/photos/tags/route";

describe("Photos Tags API", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/photos/tags", () => {
    it("should return all photo tags", async () => {
      const mockTags = [
        { id: 1, name: "Nature", _count: { photos: 5 } },
        { id: 2, name: "Portrait", _count: { photos: 3 } },
      ];
      mockPrisma.photoTag.findMany.mockResolvedValue(mockTags);

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual(mockTags);
      expect(mockPrisma.photoTag.findMany).toHaveBeenCalledWith({
        orderBy: { name: "asc" },
        include: { _count: { select: { photos: true } } },
      });
    });

    it("should handle errors", async () => {
      mockPrisma.photoTag.findMany.mockRejectedValue(new Error("DB error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch photo tags");
    });
  });

  describe("POST /api/photos/tags", () => {
    it("should create a new tag", async () => {
      const mockTag = { id: 1, name: "NewTag" };
      mockPrisma.photoTag.create.mockResolvedValue(mockTag);

      const request = new NextRequest("http://localhost/api/photos/tags", {
        method: "POST",
        body: JSON.stringify({ name: "NewTag" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockTag);
      expect(mockPrisma.photoTag.create).toHaveBeenCalledWith({
        data: { name: "NewTag" },
      });
    });

    it("should trim tag name", async () => {
      const mockTag = { id: 1, name: "TrimmedTag" };
      mockPrisma.photoTag.create.mockResolvedValue(mockTag);

      const request = new NextRequest("http://localhost/api/photos/tags", {
        method: "POST",
        body: JSON.stringify({ name: "  TrimmedTag  " }),
      });

      await POST(request);

      expect(mockPrisma.photoTag.create).toHaveBeenCalledWith({
        data: { name: "TrimmedTag" },
      });
    });

    it("should return 400 if name is missing", async () => {
      const request = new NextRequest("http://localhost/api/photos/tags", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Tag name is required");
    });

    it("should return 400 if name is not a string", async () => {
      const request = new NextRequest("http://localhost/api/photos/tags", {
        method: "POST",
        body: JSON.stringify({ name: 123 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Tag name is required");
    });

    it("should return 409 if tag already exists", async () => {
      mockPrisma.photoTag.create.mockRejectedValue({ code: "P2002" });

      const request = new NextRequest("http://localhost/api/photos/tags", {
        method: "POST",
        body: JSON.stringify({ name: "ExistingTag" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Tag already exists");
    });

    it("should handle other errors", async () => {
      mockPrisma.photoTag.create.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost/api/photos/tags", {
        method: "POST",
        body: JSON.stringify({ name: "NewTag" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create photo tag");
    });
  });
});
