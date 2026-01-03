import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { PUT as putPhotoTag, DELETE as deletePhotoTag } from "@/app/api/photos/tags/[id]/route";
import { PUT as putArticleTag, DELETE as deleteArticleTag } from "@/app/api/articles/tags/[id]/route";

describe("Tags [id] API", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("Photo Tags", () => {
    describe("PUT /api/photos/tags/[id]", () => {
      it("should update a photo tag", async () => {
        mockPrisma.photoTag.update.mockResolvedValue({
          id: 1, name: "Updated Tag"
        });

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated Tag" }),
        });

        const response = await putPhotoTag(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.name).toBe("Updated Tag");
      });

      it("should return error for invalid tag ID", async () => {
        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        });

        const response = await putPhotoTag(request, { params: Promise.resolve({ id: "invalid" }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid tag ID");
      });

      it("should return error for missing name", async () => {
        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({}),
        });

        const response = await putPhotoTag(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Tag name is required");
      });

      it("should handle duplicate name error", async () => {
        mockPrisma.photoTag.update.mockRejectedValue({ code: "P2002" });

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Duplicate" }),
        });

        const response = await putPhotoTag(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe("Tag name already exists");
      });

      it("should handle not found error", async () => {
        mockPrisma.photoTag.update.mockRejectedValue({ code: "P2025" });

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        });

        const response = await putPhotoTag(request, { params: Promise.resolve({ id: "999" }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Tag not found");
      });

      it("should handle general errors", async () => {
        mockPrisma.photoTag.update.mockRejectedValue(new Error("DB error"));

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        });

        const response = await putPhotoTag(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to update photo tag");
      });
    });

    describe("DELETE /api/photos/tags/[id]", () => {
      it("should delete a photo tag", async () => {
        mockPrisma.photoTag.delete.mockResolvedValue({ id: 1 });

        const response = await deletePhotoTag(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "1" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it("should return error for invalid tag ID", async () => {
        const response = await deletePhotoTag(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "invalid" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid tag ID");
      });

      it("should handle not found error", async () => {
        mockPrisma.photoTag.delete.mockRejectedValue({ code: "P2025" });

        const response = await deletePhotoTag(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "999" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Tag not found");
      });

      it("should handle general errors", async () => {
        mockPrisma.photoTag.delete.mockRejectedValue(new Error("DB error"));

        const response = await deletePhotoTag(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "1" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to delete photo tag");
      });
    });
  });

  describe("Article Tags", () => {
    describe("PUT /api/articles/tags/[id]", () => {
      it("should update an article tag", async () => {
        mockPrisma.articleTag.update.mockResolvedValue({
          id: 1, name: "Updated Tag"
        });

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated Tag" }),
        });

        const response = await putArticleTag(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.name).toBe("Updated Tag");
      });

      it("should return error for invalid tag ID", async () => {
        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        });

        const response = await putArticleTag(request, { params: Promise.resolve({ id: "invalid" }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid tag ID");
      });

      it("should return error for missing name", async () => {
        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({}),
        });

        const response = await putArticleTag(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Tag name is required");
      });

      it("should handle duplicate name error", async () => {
        mockPrisma.articleTag.update.mockRejectedValue({ code: "P2002" });

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Duplicate" }),
        });

        const response = await putArticleTag(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe("Tag name already exists");
      });

      it("should handle not found error", async () => {
        mockPrisma.articleTag.update.mockRejectedValue({ code: "P2025" });

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        });

        const response = await putArticleTag(request, { params: Promise.resolve({ id: "999" }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Tag not found");
      });

      it("should handle general errors", async () => {
        mockPrisma.articleTag.update.mockRejectedValue(new Error("DB error"));

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        });

        const response = await putArticleTag(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to update article tag");
      });
    });

    describe("DELETE /api/articles/tags/[id]", () => {
      it("should delete an article tag", async () => {
        mockPrisma.articleTag.delete.mockResolvedValue({ id: 1 });

        const response = await deleteArticleTag(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "1" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it("should return error for invalid tag ID", async () => {
        const response = await deleteArticleTag(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "invalid" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid tag ID");
      });

      it("should handle not found error", async () => {
        mockPrisma.articleTag.delete.mockRejectedValue({ code: "P2025" });

        const response = await deleteArticleTag(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "999" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Tag not found");
      });

      it("should handle general errors", async () => {
        mockPrisma.articleTag.delete.mockRejectedValue(new Error("DB error"));

        const response = await deleteArticleTag(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "1" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to delete article tag");
      });
    });
  });
});
