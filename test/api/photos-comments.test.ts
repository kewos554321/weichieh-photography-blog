import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET } from "@/app/api/photos/[slug]/comments/route";

describe("Photos [slug] Comments API", () => {
  beforeEach(() => {
    resetMocks();
  });

  const createRequest = () => {
    return new Request("http://localhost/api/photos/test-photo/comments");
  };

  const createParams = (slug: string) => ({
    params: Promise.resolve({ slug }),
  });

  describe("GET /api/photos/[slug]/comments", () => {
    it("should return approved comments for a photo", async () => {
      const mockPhoto = { id: 1 };
      const mockComments = [
        { id: 1, name: "User 1", content: "Comment 1", createdAt: new Date() },
        { id: 2, name: "User 2", content: "Comment 2", createdAt: new Date() },
      ];

      mockPrisma.photo.findUnique.mockResolvedValue(mockPhoto);
      mockPrisma.comment.findMany.mockResolvedValue(mockComments);

      const response = await GET(createRequest(), createParams("test-photo"));
      const data = await response.json();

      expect(data.comments).toHaveLength(2);
      expect(data.comments[0].id).toBe(1);
      expect(data.comments[0].name).toBe("User 1");
      expect(data.comments[1].id).toBe(2);
      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: {
          photoId: 1,
          status: "APPROVED",
        },
        select: {
          id: true,
          name: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
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
      expect(data.error).toBe("Failed to fetch comments");
    });
  });
});
