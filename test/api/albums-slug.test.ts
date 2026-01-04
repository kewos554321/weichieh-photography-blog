import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET, PUT, DELETE } from "@/app/api/albums/[slug]/route";

describe("Albums [slug] API", () => {
  beforeEach(() => {
    resetMocks();
  });

  const createRequest = (slug: string, method = "GET", body?: object, admin = false) => {
    const url = admin
      ? `http://localhost/api/albums/${slug}?admin=true`
      : `http://localhost/api/albums/${slug}`;
    return new NextRequest(url, {
      method,
      ...(body && { body: JSON.stringify(body) }),
    });
  };

  const createParams = (slug: string) => ({
    params: Promise.resolve({ slug }),
  });

  describe("GET /api/albums/[slug]", () => {
    it("should return album with published photos for non-admin", async () => {
      const mockAlbum = {
        id: 1,
        slug: "test-album",
        name: "Test Album",
        isPublic: true,
        photos: [
          { photo: { id: 1, status: "published", tags: [] } },
          { photo: { id: 2, status: "draft", tags: [] } },
        ],
      };
      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum);

      const response = await GET(createRequest("test-album"), createParams("test-album"));
      const data = await response.json();

      expect(data.photos).toHaveLength(1);
      expect(data.photos[0].id).toBe(1);
    });

    it("should return album with all photos for admin", async () => {
      const mockAlbum = {
        id: 1,
        slug: "test-album",
        name: "Test Album",
        isPublic: true,
        photos: [
          { photo: { id: 1, status: "published", tags: [] } },
          { photo: { id: 2, status: "draft", tags: [] } },
        ],
      };
      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum);

      const response = await GET(
        createRequest("test-album", "GET", undefined, true),
        createParams("test-album")
      );
      const data = await response.json();

      expect(data.photos).toHaveLength(2);
    });

    it("should return 404 for non-existent album", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(null);

      const response = await GET(createRequest("nonexistent"), createParams("nonexistent"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Album not found");
    });

    it("should return 404 for private album when not admin", async () => {
      const mockAlbum = {
        id: 1,
        slug: "private-album",
        name: "Private Album",
        isPublic: false,
        photos: [],
      };
      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum);

      const response = await GET(createRequest("private-album"), createParams("private-album"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Album not found");
    });

    it("should return private album for admin", async () => {
      const mockAlbum = {
        id: 1,
        slug: "private-album",
        name: "Private Album",
        isPublic: false,
        photos: [],
      };
      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum);

      const response = await GET(
        createRequest("private-album", "GET", undefined, true),
        createParams("private-album")
      );
      const data = await response.json();

      expect(data.name).toBe("Private Album");
    });

    it("should handle errors", async () => {
      mockPrisma.album.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await GET(createRequest("test-album"), createParams("test-album"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch album");
    });
  });

  describe("PUT /api/albums/[slug]", () => {
    it("should update album", async () => {
      const mockAlbum = {
        id: 1,
        slug: "test-album",
        name: "Test Album",
        description: "Desc",
        coverUrl: null,
        isPublic: true,
        sortOrder: 1,
      };
      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum);
      mockPrisma.album.update.mockResolvedValue({
        ...mockAlbum,
        name: "Updated Name",
      });

      const response = await PUT(
        createRequest("test-album", "PUT", { name: "Updated Name" }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(data.name).toBe("Updated Name");
    });

    it("should return 404 for non-existent album", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(null);

      const response = await PUT(
        createRequest("nonexistent", "PUT", { name: "Updated" }),
        createParams("nonexistent")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Album not found");
    });

    it("should return 409 if new slug already exists", async () => {
      const mockAlbum = { id: 1, slug: "test-album", name: "Test" };
      mockPrisma.album.findUnique
        .mockResolvedValueOnce(mockAlbum) // First call: find current album
        .mockResolvedValueOnce({ id: 2, slug: "existing-slug" }); // Second call: check new slug

      const response = await PUT(
        createRequest("test-album", "PUT", { slug: "existing-slug" }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Slug already exists");
    });

    it("should allow updating slug if new slug is same as current", async () => {
      const mockAlbum = {
        id: 1,
        slug: "test-album",
        name: "Test",
        description: null,
        coverUrl: null,
        isPublic: true,
        sortOrder: 1,
      };
      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum);
      mockPrisma.album.update.mockResolvedValue(mockAlbum);

      const response = await PUT(
        createRequest("test-album", "PUT", { slug: "test-album" }),
        createParams("test-album")
      );

      expect(response.status).toBe(200);
    });

    it("should handle errors", async () => {
      mockPrisma.album.findUnique.mockResolvedValue({ id: 1, slug: "test" });
      mockPrisma.album.update.mockRejectedValue(new Error("DB error"));

      const response = await PUT(
        createRequest("test-album", "PUT", { name: "Updated" }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update album");
    });
  });

  describe("DELETE /api/albums/[slug]", () => {
    it("should delete album", async () => {
      mockPrisma.album.findUnique.mockResolvedValue({ id: 1, slug: "test-album" });
      mockPrisma.album.delete.mockResolvedValue({ id: 1 });

      const response = await DELETE(
        createRequest("test-album", "DELETE"),
        createParams("test-album")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockPrisma.album.delete).toHaveBeenCalledWith({
        where: { slug: "test-album" },
      });
    });

    it("should return 404 for non-existent album", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(null);

      const response = await DELETE(
        createRequest("nonexistent", "DELETE"),
        createParams("nonexistent")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Album not found");
    });

    it("should handle errors", async () => {
      mockPrisma.album.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.album.delete.mockRejectedValue(new Error("DB error"));

      const response = await DELETE(
        createRequest("test-album", "DELETE"),
        createParams("test-album")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete album");
    });
  });
});
