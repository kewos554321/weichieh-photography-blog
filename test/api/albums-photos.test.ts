import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { POST, DELETE, PUT } from "@/app/api/albums/[slug]/photos/route";

describe("Albums [slug] Photos API", () => {
  beforeEach(() => {
    resetMocks();
  });

  const createRequest = (slug: string, method: string, body?: object) => {
    return new NextRequest(`http://localhost/api/albums/${slug}/photos`, {
      method,
      ...(body && { body: JSON.stringify(body) }),
    });
  };

  const createParams = (slug: string) => ({
    params: Promise.resolve({ slug }),
  });

  describe("POST /api/albums/[slug]/photos", () => {
    it("should add photos to album", async () => {
      const mockAlbum = { id: 1, slug: "test-album", coverUrl: null };
      const mockPhoto = { id: 1, src: "https://example.com/photo.jpg" };

      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum);
      mockPrisma.albumPhoto.aggregate.mockResolvedValue({ _max: { sortOrder: 0 } });
      mockPrisma.albumPhoto.findMany.mockResolvedValue([]);
      mockPrisma.albumPhoto.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);
      mockPrisma.album.update.mockResolvedValue({ ...mockAlbum, coverUrl: mockPhoto.src });

      const response = await POST(
        createRequest("test-album", "POST", { photoIds: [1, 2] }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(data.added).toBe(2);
      expect(data.skipped).toBe(0);
    });

    it("should skip already existing photos", async () => {
      const mockAlbum = { id: 1, slug: "test-album", coverUrl: "existing.jpg" };

      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum);
      mockPrisma.albumPhoto.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
      mockPrisma.albumPhoto.findMany.mockResolvedValue([{ photoId: 1 }]);
      mockPrisma.albumPhoto.createMany.mockResolvedValue({ count: 1 });

      const response = await POST(
        createRequest("test-album", "POST", { photoIds: [1, 2] }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(data.added).toBe(1);
      expect(data.skipped).toBe(1);
    });

    it("should return message when all photos already in album", async () => {
      const mockAlbum = { id: 1, slug: "test-album", coverUrl: "existing.jpg" };

      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum);
      mockPrisma.albumPhoto.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
      mockPrisma.albumPhoto.findMany.mockResolvedValue([{ photoId: 1 }, { photoId: 2 }]);

      const response = await POST(
        createRequest("test-album", "POST", { photoIds: [1, 2] }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(data.added).toBe(0);
      expect(data.message).toBe("All photos already in album");
    });

    it("should set cover URL if album has no cover", async () => {
      const mockAlbum = { id: 1, slug: "test-album", coverUrl: null };
      const mockPhoto = { id: 1, src: "https://example.com/photo.jpg" };

      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum);
      mockPrisma.albumPhoto.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
      mockPrisma.albumPhoto.findMany.mockResolvedValue([]);
      mockPrisma.albumPhoto.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);
      mockPrisma.album.update.mockResolvedValue({});

      await POST(
        createRequest("test-album", "POST", { photoIds: [1] }),
        createParams("test-album")
      );

      expect(mockPrisma.album.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { coverUrl: mockPhoto.src },
      });
    });

    it("should return 400 if photoIds is not an array", async () => {
      const response = await POST(
        createRequest("test-album", "POST", { photoIds: "invalid" }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("photoIds array is required");
    });

    it("should return 400 if photoIds is empty", async () => {
      const response = await POST(
        createRequest("test-album", "POST", { photoIds: [] }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("photoIds array is required");
    });

    it("should return 404 if album not found", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(null);

      const response = await POST(
        createRequest("nonexistent", "POST", { photoIds: [1] }),
        createParams("nonexistent")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Album not found");
    });

    it("should handle errors", async () => {
      mockPrisma.album.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await POST(
        createRequest("test-album", "POST", { photoIds: [1] }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to add photos");
    });
  });

  describe("DELETE /api/albums/[slug]/photos", () => {
    it("should remove photos from album", async () => {
      const mockAlbum = { id: 1, slug: "test-album" };

      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum);
      mockPrisma.albumPhoto.deleteMany.mockResolvedValue({ count: 2 });

      const response = await DELETE(
        createRequest("test-album", "DELETE", { photoIds: [1, 2] }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(data.removed).toBe(2);
    });

    it("should return 400 if photoIds is not an array", async () => {
      const response = await DELETE(
        createRequest("test-album", "DELETE", { photoIds: "invalid" }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("photoIds array is required");
    });

    it("should return 400 if photoIds is empty", async () => {
      const response = await DELETE(
        createRequest("test-album", "DELETE", { photoIds: [] }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("photoIds array is required");
    });

    it("should return 404 if album not found", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(null);

      const response = await DELETE(
        createRequest("nonexistent", "DELETE", { photoIds: [1] }),
        createParams("nonexistent")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Album not found");
    });

    it("should handle errors", async () => {
      mockPrisma.album.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await DELETE(
        createRequest("test-album", "DELETE", { photoIds: [1] }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to remove photos");
    });
  });

  describe("PUT /api/albums/[slug]/photos", () => {
    it("should reorder photos in album", async () => {
      const mockAlbum = { id: 1, slug: "test-album" };

      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum);
      mockPrisma.albumPhoto.updateMany.mockResolvedValue({ count: 1 });

      const response = await PUT(
        createRequest("test-album", "PUT", { photoIds: [3, 1, 2] }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockPrisma.albumPhoto.updateMany).toHaveBeenCalledTimes(3);
    });

    it("should return 400 if photoIds is not an array", async () => {
      const response = await PUT(
        createRequest("test-album", "PUT", { photoIds: "invalid" }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("photoIds array is required");
    });

    it("should return 404 if album not found", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(null);

      const response = await PUT(
        createRequest("nonexistent", "PUT", { photoIds: [1, 2] }),
        createParams("nonexistent")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Album not found");
    });

    it("should handle errors", async () => {
      mockPrisma.album.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await PUT(
        createRequest("test-album", "PUT", { photoIds: [1, 2] }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to reorder photos");
    });
  });
});
