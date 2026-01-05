import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

const { mockGenerateUniqueAlbumSlug } = vi.hoisted(() => {
  const mockGenerateUniqueAlbumSlug = vi.fn();
  return { mockGenerateUniqueAlbumSlug };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/slug", () => ({
  generateUniqueAlbumSlug: mockGenerateUniqueAlbumSlug,
}));

import { GET, PUT, DELETE } from "@/app/api/albums/[slug]/route";

describe("Albums [slug] API", () => {
  beforeEach(() => {
    resetMocks();
    mockGenerateUniqueAlbumSlug.mockReset();
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
        visibility: "public",
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
        visibility: "public",
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
        visibility: "private",
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
        visibility: "private",
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
    const mockCurrentAlbum = { name: "Test Album" };

    it("should update album", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(mockCurrentAlbum);
      mockPrisma.album.update.mockResolvedValue({
        id: 1,
        slug: "test-album",
        name: "Updated Name",
      });
      mockGenerateUniqueAlbumSlug.mockResolvedValue("updated-name");

      const response = await PUT(
        createRequest("test-album", "PUT", { name: "Updated Name" }),
        createParams("test-album")
      );
      const data = await response.json();

      expect(data.name).toBe("Updated Name");
    });

    it("should regenerate slug when name changes", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(mockCurrentAlbum);
      mockPrisma.album.update.mockResolvedValue({
        id: 1,
        slug: "new-name",
        name: "New Name",
      });
      mockGenerateUniqueAlbumSlug.mockResolvedValue("new-name");

      await PUT(
        createRequest("test-album", "PUT", { name: "New Name" }),
        createParams("test-album")
      );

      expect(mockGenerateUniqueAlbumSlug).toHaveBeenCalledWith("New Name", "test-album");
      expect(mockPrisma.album.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: "new-name",
          }),
        })
      );
    });

    it("should not regenerate slug when name unchanged", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(mockCurrentAlbum);
      mockPrisma.album.update.mockResolvedValue({
        id: 1,
        slug: "test-album",
        name: "Test Album",
      });

      await PUT(
        createRequest("test-album", "PUT", { name: "Test Album" }),
        createParams("test-album")
      );

      expect(mockGenerateUniqueAlbumSlug).not.toHaveBeenCalled();
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

    it("should update description", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(mockCurrentAlbum);
      mockPrisma.album.update.mockResolvedValue({
        id: 1,
        slug: "test-album",
        name: "Test Album",
        description: "New description",
      });

      await PUT(
        createRequest("test-album", "PUT", { description: "New description" }),
        createParams("test-album")
      );

      expect(mockPrisma.album.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: "New description",
          }),
        })
      );
    });

    it("should update visibility", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(mockCurrentAlbum);
      mockPrisma.album.update.mockResolvedValue({
        id: 1,
        slug: "test-album",
        name: "Test Album",
        visibility: "private",
      });

      await PUT(
        createRequest("test-album", "PUT", { visibility: "private" }),
        createParams("test-album")
      );

      expect(mockPrisma.album.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            visibility: "private",
          }),
        })
      );
    });

    it("should handle errors", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(mockCurrentAlbum);
      mockPrisma.album.update.mockRejectedValue(new Error("DB error"));

      const response = await PUT(
        createRequest("test-album", "PUT", { description: "Updated" }),
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
