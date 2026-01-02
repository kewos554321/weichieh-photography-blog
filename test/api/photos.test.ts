import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from "@/app/api/photos/route";

describe("Photos API", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/photos", () => {
    it("should return photos list", async () => {
      const mockPhotos = [
        { id: 1, slug: "photo-1", title: "Photo 1", tags: [] },
      ];
      mockPrisma.photo.findMany.mockResolvedValue(mockPhotos);
      mockPrisma.photo.count.mockResolvedValue(1);

      const request = new NextRequest("http://localhost/api/photos");
      const response = await GET(request);
      const data = await response.json();

      expect(data.photos).toEqual(mockPhotos);
      expect(data.total).toBe(1);
    });

    it("should filter by category", async () => {
      mockPrisma.photo.findMany.mockResolvedValue([]);
      mockPrisma.photo.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/photos?category=Portrait"
      );
      await GET(request);

      expect(mockPrisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: "Portrait" }),
        })
      );
    });

    it("should not filter when category is All", async () => {
      mockPrisma.photo.findMany.mockResolvedValue([]);
      mockPrisma.photo.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/photos?category=All"
      );
      await GET(request);

      expect(mockPrisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it("should filter by tag", async () => {
      mockPrisma.photo.findMany.mockResolvedValue([]);
      mockPrisma.photo.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/photos?tag=Nature"
      );
      await GET(request);

      expect(mockPrisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { some: { name: "Nature" } },
          }),
        })
      );
    });

    it("should filter by search", async () => {
      mockPrisma.photo.findMany.mockResolvedValue([]);
      mockPrisma.photo.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/photos?search=sunset"
      );
      await GET(request);

      expect(mockPrisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: "sunset", mode: "insensitive" } },
              { location: { contains: "sunset", mode: "insensitive" } },
            ],
          }),
        })
      );
    });

    it("should respect limit and offset", async () => {
      mockPrisma.photo.findMany.mockResolvedValue([]);
      mockPrisma.photo.count.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost/api/photos?limit=10&offset=20"
      );
      await GET(request);

      expect(mockPrisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it("should handle errors", async () => {
      mockPrisma.photo.findMany.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost/api/photos");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch photos");
    });
  });

  describe("POST /api/photos", () => {
    const validPhotoData = {
      slug: "new-photo",
      title: "New Photo",
      src: "https://example.com/photo.jpg",
      category: "Portrait",
      location: "Tokyo",
      date: "2024-01-01",
      story: "A beautiful photo story",
    };

    it("should create a new photo", async () => {
      const mockPhoto = { id: 1, ...validPhotoData, tags: [] };
      mockPrisma.photo.findUnique.mockResolvedValue(null);
      mockPrisma.photo.create.mockResolvedValue(mockPhoto);

      const request = new NextRequest("http://localhost/api/photos", {
        method: "POST",
        body: JSON.stringify(validPhotoData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockPhoto);
    });

    it("should create photo with tags", async () => {
      const mockPhoto = { id: 1, ...validPhotoData, tags: [{ id: 1, name: "Nature" }] };
      mockPrisma.photo.findUnique.mockResolvedValue(null);
      mockPrisma.photo.create.mockResolvedValue(mockPhoto);

      const request = new NextRequest("http://localhost/api/photos", {
        method: "POST",
        body: JSON.stringify({ ...validPhotoData, tagIds: [1] }),
      });

      await POST(request);

      expect(mockPrisma.photo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: { connect: [{ id: 1 }] },
          }),
        })
      );
    });

    it("should create photo with optional fields", async () => {
      const photoWithOptional = {
        ...validPhotoData,
        camera: "Sony A7IV",
        lens: "85mm f/1.4",
        behindTheScene: "Behind the scene story",
      };
      const mockPhoto = { id: 1, ...photoWithOptional, tags: [] };
      mockPrisma.photo.findUnique.mockResolvedValue(null);
      mockPrisma.photo.create.mockResolvedValue(mockPhoto);

      const request = new NextRequest("http://localhost/api/photos", {
        method: "POST",
        body: JSON.stringify(photoWithOptional),
      });

      await POST(request);

      expect(mockPrisma.photo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            camera: "Sony A7IV",
            lens: "85mm f/1.4",
            behindTheScene: "Behind the scene story",
          }),
        })
      );
    });

    it("should return 400 if required fields are missing", async () => {
      const request = new NextRequest("http://localhost/api/photos", {
        method: "POST",
        body: JSON.stringify({ slug: "test" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
    });

    it("should return 409 if slug already exists", async () => {
      mockPrisma.photo.findUnique.mockResolvedValue({ id: 1 });

      const request = new NextRequest("http://localhost/api/photos", {
        method: "POST",
        body: JSON.stringify(validPhotoData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Slug already exists");
    });

    it("should handle errors", async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(null);
      mockPrisma.photo.create.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost/api/photos", {
        method: "POST",
        body: JSON.stringify(validPhotoData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create photo");
    });
  });
});
