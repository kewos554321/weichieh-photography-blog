import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from "@/app/api/albums/route";

describe("Albums API", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/albums", () => {
    it("should return public albums only for non-admin requests", async () => {
      const mockAlbums = [
        {
          id: 1,
          slug: "album-1",
          name: "Album 1",
          visibility: "public",
          photos: [{ photo: { id: 1, slug: "photo-1", src: "url", title: "Photo 1" } }],
          _count: { photos: 5 },
        },
      ];
      mockPrisma.album.findMany.mockResolvedValue(mockAlbums);

      const request = new NextRequest("http://localhost/api/albums");
      const response = await GET(request);
      const data = await response.json();

      expect(mockPrisma.album.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { visibility: "public" },
        })
      );
      expect(data[0].photoCount).toBe(5);
      expect(data[0].previewPhotos).toEqual([{ id: 1, slug: "photo-1", src: "url", title: "Photo 1" }]);
    });

    it("should return all albums for admin requests", async () => {
      const mockAlbums = [
        {
          id: 1,
          slug: "album-1",
          name: "Album 1",
          visibility: "private",
          photos: [],
          _count: { photos: 0 },
        },
      ];
      mockPrisma.album.findMany.mockResolvedValue(mockAlbums);

      const request = new NextRequest("http://localhost/api/albums?admin=true");
      const response = await GET(request);
      await response.json();

      expect(mockPrisma.album.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it("should handle errors", async () => {
      mockPrisma.album.findMany.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost/api/albums");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch albums");
    });
  });

  describe("POST /api/albums", () => {
    it("should create a new album", async () => {
      const mockAlbum = {
        id: 1,
        name: "New Album",
        slug: "new-album",
        description: "Description",
        coverUrl: "https://example.com/cover.jpg",
        visibility: "public",
        sortOrder: 1,
      };
      mockPrisma.album.findUnique.mockResolvedValue(null);
      mockPrisma.album.aggregate.mockResolvedValue({ _max: { sortOrder: 0 } });
      mockPrisma.album.create.mockResolvedValue(mockAlbum);

      const request = new NextRequest("http://localhost/api/albums", {
        method: "POST",
        body: JSON.stringify({
          name: "New Album",
          slug: "new-album",
          description: "Description",
          coverUrl: "https://example.com/cover.jpg",
          visibility: "public",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockAlbum);
    });

    it("should create album with default values", async () => {
      const mockAlbum = {
        id: 1,
        name: "New Album",
        slug: "new-album",
        description: null,
        coverUrl: null,
        visibility: "public",
        sortOrder: 1,
      };
      mockPrisma.album.findUnique.mockResolvedValue(null);
      mockPrisma.album.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
      mockPrisma.album.create.mockResolvedValue(mockAlbum);

      const request = new NextRequest("http://localhost/api/albums", {
        method: "POST",
        body: JSON.stringify({
          name: "New Album",
          slug: "new-album",
        }),
      });

      await POST(request);

      expect(mockPrisma.album.create).toHaveBeenCalledWith({
        data: {
          name: "New Album",
          slug: "new-album",
          description: null,
          coverUrl: null,
          visibility: "public",
          sortOrder: 1,
        },
      });
    });

    it("should return 400 if name is missing", async () => {
      const request = new NextRequest("http://localhost/api/albums", {
        method: "POST",
        body: JSON.stringify({ slug: "test" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Name and slug are required");
    });

    it("should return 400 if slug is missing", async () => {
      const request = new NextRequest("http://localhost/api/albums", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Name and slug are required");
    });

    it("should return 409 if slug already exists", async () => {
      mockPrisma.album.findUnique.mockResolvedValue({ id: 1 });

      const request = new NextRequest("http://localhost/api/albums", {
        method: "POST",
        body: JSON.stringify({ name: "Test", slug: "existing-slug" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Slug already exists");
    });

    it("should handle errors", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(null);
      mockPrisma.album.aggregate.mockResolvedValue({ _max: { sortOrder: 0 } });
      mockPrisma.album.create.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost/api/albums", {
        method: "POST",
        body: JSON.stringify({ name: "Test", slug: "test" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create album");
    });
  });
});
