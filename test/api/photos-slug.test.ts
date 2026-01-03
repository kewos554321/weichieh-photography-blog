import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

// Use vi.hoisted to ensure mocks are available before vi.mock
const { mockSend, MockS3Client, MockDeleteObjectCommand } = vi.hoisted(() => {
  const mockSend = vi.fn();
  return {
    mockSend,
    MockS3Client: class {
      send = mockSend;
    },
    MockDeleteObjectCommand: class {
      constructor(public params: unknown) {}
    },
  };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: MockS3Client,
  DeleteObjectCommand: MockDeleteObjectCommand,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET, PUT, DELETE } from "@/app/api/photos/[slug]/route";

describe("Photos [slug] API", () => {
  beforeEach(() => {
    resetMocks();
    mockSend.mockReset();
  });

  const createRequest = (slug: string, method = "GET", body?: object) => {
    return new NextRequest(`http://localhost/api/photos/${slug}`, {
      method,
      ...(body && { body: JSON.stringify(body) }),
    });
  };

  const createParams = (slug: string) => ({
    params: Promise.resolve({ slug }),
  });

  describe("GET /api/photos/[slug]", () => {
    it("should return a published photo", async () => {
      const mockPhoto = {
        id: 1,
        slug: "test-photo",
        title: "Test Photo",
        status: "published",
        publishedAt: null,
        tags: [],
      };
      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);

      const response = await GET(
        createRequest("test-photo"),
        createParams("test-photo")
      );
      const data = await response.json();

      expect(data).toEqual(mockPhoto);
      expect(mockPrisma.photo.findUnique).toHaveBeenCalledWith({
        where: { slug: "test-photo" },
        include: {
          tags: true,
          article: {
            select: {
              id: true,
              slug: true,
              title: true,
              excerpt: true,
              cover: true,
              status: true,
            },
          },
        },
      });
    });

    it("should return 404 for unpublished photo without admin", async () => {
      const mockPhoto = {
        id: 1,
        slug: "test-photo",
        status: "draft",
        publishedAt: null,
        tags: [],
      };
      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);

      const response = await GET(
        createRequest("test-photo"),
        createParams("test-photo")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Photo not found");
    });

    it("should return unpublished photo with admin=true", async () => {
      const mockPhoto = {
        id: 1,
        slug: "test-photo",
        status: "draft",
        publishedAt: null,
        tags: [],
      };
      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);

      const response = await GET(
        new NextRequest("http://localhost/api/photos/test-photo?admin=true"),
        createParams("test-photo")
      );
      const data = await response.json();

      expect(data).toEqual(mockPhoto);
    });

    it("should return 404 for scheduled photo not yet due", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const mockPhoto = {
        id: 1,
        slug: "test-photo",
        status: "published",
        publishedAt: futureDate,
        tags: [],
      };
      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);

      const response = await GET(
        createRequest("test-photo"),
        createParams("test-photo")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Photo not found");
    });

    it("should return 404 if photo not found", async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(null);

      const response = await GET(
        createRequest("nonexistent"),
        createParams("nonexistent")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Photo not found");
    });

    it("should handle errors", async () => {
      mockPrisma.photo.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await GET(
        createRequest("test-photo"),
        createParams("test-photo")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch photo");
    });
  });

  describe("PUT /api/photos/[slug]", () => {
    it("should update a photo", async () => {
      const mockPhoto = { id: 1, slug: "test-photo", title: "Updated Title" };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      const response = await PUT(
        createRequest("test-photo", "PUT", { title: "Updated Title" }),
        createParams("test-photo")
      );
      const data = await response.json();

      expect(data).toEqual(mockPhoto);
    });

    it("should update photo with new image", async () => {
      const mockPhoto = { id: 1, slug: "test-photo", src: "https://new.com/image.jpg" };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      const response = await PUT(
        createRequest("test-photo", "PUT", { src: "https://new.com/image.jpg" }),
        createParams("test-photo")
      );

      expect(mockPrisma.photo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ src: "https://new.com/image.jpg" }),
        })
      );
    });

    it("should update photo with tags", async () => {
      const mockPhoto = { id: 1, slug: "test-photo", tags: [{ id: 1 }] };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      await PUT(
        createRequest("test-photo", "PUT", { tagIds: [1, 2] }),
        createParams("test-photo")
      );

      expect(mockPrisma.photo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: { set: [{ id: 1 }, { id: 2 }] },
          }),
        })
      );
    });

    it("should update date when provided", async () => {
      const mockPhoto = { id: 1, slug: "test-photo" };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      await PUT(
        createRequest("test-photo", "PUT", { date: "2024-06-15" }),
        createParams("test-photo")
      );

      expect(mockPrisma.photo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: new Date("2024-06-15"),
          }),
        })
      );
    });

    it("should not update date when not provided", async () => {
      const mockPhoto = { id: 1, slug: "test-photo" };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      await PUT(
        createRequest("test-photo", "PUT", { title: "Test" }),
        createParams("test-photo")
      );

      expect(mockPrisma.photo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: undefined,
          }),
        })
      );
    });

    it("should update status", async () => {
      const mockPhoto = { id: 1, slug: "test-photo", status: "published" };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      await PUT(
        createRequest("test-photo", "PUT", { status: "published" }),
        createParams("test-photo")
      );

      expect(mockPrisma.photo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "published",
          }),
        })
      );
    });

    it("should update publishedAt", async () => {
      const publishedAt = "2025-06-15T10:00:00";
      const mockPhoto = { id: 1, slug: "test-photo", publishedAt: new Date(publishedAt) };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      await PUT(
        createRequest("test-photo", "PUT", { publishedAt }),
        createParams("test-photo")
      );

      expect(mockPrisma.photo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: new Date(publishedAt),
          }),
        })
      );
    });

    it("should clear publishedAt when set to null", async () => {
      const mockPhoto = { id: 1, slug: "test-photo", publishedAt: null };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      await PUT(
        createRequest("test-photo", "PUT", { publishedAt: null }),
        createParams("test-photo")
      );

      expect(mockPrisma.photo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: null,
          }),
        })
      );
    });

    it("should update latitude and longitude when provided", async () => {
      const mockPhoto = { id: 1, slug: "test-photo", latitude: 25.033, longitude: 121.565 };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      await PUT(
        createRequest("test-photo", "PUT", { latitude: 25.033, longitude: 121.565 }),
        createParams("test-photo")
      );

      expect(mockPrisma.photo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            latitude: 25.033,
            longitude: 121.565,
          }),
        })
      );
    });

    it("should update articleId when provided", async () => {
      const mockPhoto = { id: 1, slug: "test-photo", articleId: 5 };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      await PUT(
        createRequest("test-photo", "PUT", { articleId: 5 }),
        createParams("test-photo")
      );

      expect(mockPrisma.photo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            articleId: 5,
          }),
        })
      );
    });

    it("should clear articleId when set to null", async () => {
      const mockPhoto = { id: 1, slug: "test-photo", articleId: null };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      await PUT(
        createRequest("test-photo", "PUT", { articleId: null }),
        createParams("test-photo")
      );

      expect(mockPrisma.photo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            articleId: null,
          }),
        })
      );
    });

    it("should handle errors", async () => {
      mockPrisma.photo.update.mockRejectedValue(new Error("DB error"));

      const response = await PUT(
        createRequest("test-photo", "PUT", { title: "Test" }),
        createParams("test-photo")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update photo");
    });
  });

  describe("DELETE /api/photos/[slug]", () => {
    const R2_PUBLIC_URL = "https://test.r2.dev";

    beforeEach(() => {
      process.env.R2_PUBLIC_URL = R2_PUBLIC_URL;
    });

    it("should delete a photo and R2 file", async () => {
      const mockPhoto = {
        id: 1,
        slug: "test-photo",
        src: `${R2_PUBLIC_URL}/photos/test.jpg`,
      };
      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);
      mockPrisma.photo.delete.mockResolvedValue(mockPhoto);
      mockSend.mockResolvedValue({});

      const response = await DELETE(
        createRequest("test-photo", "DELETE"),
        createParams("test-photo")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockSend).toHaveBeenCalled();
      expect(mockPrisma.photo.delete).toHaveBeenCalledWith({
        where: { slug: "test-photo" },
      });
    });

    it("should skip R2 deletion if URL doesn't match", async () => {
      const mockPhoto = {
        id: 1,
        slug: "test-photo",
        src: "https://other.com/photo.jpg",
      };
      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);
      mockPrisma.photo.delete.mockResolvedValue(mockPhoto);

      const response = await DELETE(
        createRequest("test-photo", "DELETE"),
        createParams("test-photo")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should continue deletion even if R2 fails", async () => {
      const mockPhoto = {
        id: 1,
        slug: "test-photo",
        src: `${R2_PUBLIC_URL}/photos/test.jpg`,
      };
      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);
      mockPrisma.photo.delete.mockResolvedValue(mockPhoto);
      mockSend.mockRejectedValue(new Error("R2 error"));

      const response = await DELETE(
        createRequest("test-photo", "DELETE"),
        createParams("test-photo")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockPrisma.photo.delete).toHaveBeenCalled();
    });

    it("should return 404 if photo not found", async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(null);

      const response = await DELETE(
        createRequest("nonexistent", "DELETE"),
        createParams("nonexistent")
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Photo not found");
    });

    it("should handle errors", async () => {
      mockPrisma.photo.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await DELETE(
        createRequest("test-photo", "DELETE"),
        createParams("test-photo")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete photo");
    });
  });
});
