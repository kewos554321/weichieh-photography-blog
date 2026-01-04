import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET as getPhotoCategories, POST as postPhotoCategory } from "@/app/api/photos/categories/route";
import { PUT as putPhotoCategory, DELETE as deletePhotoCategory } from "@/app/api/photos/categories/[id]/route";
import { GET as getArticleCategories, POST as postArticleCategory } from "@/app/api/articles/categories/route";
import { PUT as putArticleCategory, DELETE as deleteArticleCategory } from "@/app/api/articles/categories/[id]/route";

describe("Categories API", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("Photo Categories", () => {
    describe("GET /api/photos/categories", () => {
      it("should return photo categories", async () => {
        mockPrisma.photoCategory.findMany.mockResolvedValue([
          { id: 1, name: "Portrait", slug: "portrait", sortOrder: 0 },
          { id: 2, name: "Landscape", slug: "landscape", sortOrder: 1 },
        ]);

        const response = await getPhotoCategories();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(2);
      });

      it("should handle errors", async () => {
        mockPrisma.photoCategory.findMany.mockRejectedValue(new Error("DB error"));

        const response = await getPhotoCategories();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to fetch photo categories");
      });
    });

    describe("POST /api/photos/categories", () => {
      it("should create a photo category", async () => {
        mockPrisma.photoCategory.create.mockResolvedValue({
          id: 1, name: "New Category", slug: "new-category", sortOrder: 0
        });

        const request = new NextRequest("http://localhost/api/photos/categories", {
          method: "POST",
          body: JSON.stringify({ name: "New Category", slug: "new-category" }),
        });

        const response = await postPhotoCategory(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.name).toBe("New Category");
      });

      it("should auto-generate slug when not provided", async () => {
        mockPrisma.photoCategory.create.mockResolvedValue({
          id: 1, name: "Portrait Photos", slug: "portrait-photos", sortOrder: 0
        });

        const request = new NextRequest("http://localhost/api/photos/categories", {
          method: "POST",
          body: JSON.stringify({ name: "Portrait Photos" }),
        });

        const response = await postPhotoCategory(request);
        await response.json();

        expect(response.status).toBe(201);
        expect(mockPrisma.photoCategory.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            slug: "portrait-photos",
          }),
        });
      });

      it("should return error for missing name", async () => {
        const request = new NextRequest("http://localhost/api/photos/categories", {
          method: "POST",
          body: JSON.stringify({ slug: "test" }),
        });

        const response = await postPhotoCategory(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Category name is required");
      });

      it("should handle errors", async () => {
        mockPrisma.photoCategory.create.mockRejectedValue(new Error("DB error"));

        const request = new NextRequest("http://localhost/api/photos/categories", {
          method: "POST",
          body: JSON.stringify({ name: "Test", slug: "test" }),
        });

        const response = await postPhotoCategory(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to create photo category");
      });

      it("should return error for duplicate category", async () => {
        mockPrisma.photoCategory.create.mockRejectedValue({ code: "P2002" });

        const request = new NextRequest("http://localhost/api/photos/categories", {
          method: "POST",
          body: JSON.stringify({ name: "Duplicate", slug: "duplicate" }),
        });

        const response = await postPhotoCategory(request);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe("Category already exists");
      });
    });

    describe("PUT /api/photos/categories/[id]", () => {
      it("should update a photo category", async () => {
        mockPrisma.photoCategory.update.mockResolvedValue({
          id: 1, name: "Updated", slug: "updated", sortOrder: 1
        });

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated", slug: "updated", sortOrder: 1 }),
        });

        const response = await putPhotoCategory(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.name).toBe("Updated");
      });

      it("should return error for invalid ID", async () => {
        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        });

        const response = await putPhotoCategory(request, { params: Promise.resolve({ id: "invalid" }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid category ID");
      });

      it("should return error for missing name", async () => {
        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ slug: "test" }),
        });

        const response = await putPhotoCategory(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Category name is required");
      });

      it("should handle duplicate name error", async () => {
        mockPrisma.photoCategory.update.mockRejectedValue({ code: "P2002" });

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Duplicate" }),
        });

        const response = await putPhotoCategory(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe("Category name already exists");
      });

      it("should handle not found error", async () => {
        mockPrisma.photoCategory.update.mockRejectedValue({ code: "P2025" });

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        });

        const response = await putPhotoCategory(request, { params: Promise.resolve({ id: "999" }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Category not found");
      });

      it("should handle general errors", async () => {
        mockPrisma.photoCategory.update.mockRejectedValue(new Error("DB error"));

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        });

        const response = await putPhotoCategory(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to update photo category");
      });
    });

    describe("DELETE /api/photos/categories/[id]", () => {
      it("should delete a photo category", async () => {
        mockPrisma.photoCategory.findUnique.mockResolvedValue({ id: 1, name: "Test" });
        mockPrisma.photo.count.mockResolvedValue(0);
        mockPrisma.photoCategory.delete.mockResolvedValue({ id: 1 });

        const response = await deletePhotoCategory(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "1" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it("should return error for invalid ID", async () => {
        const response = await deletePhotoCategory(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "invalid" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid category ID");
      });

      it("should prevent deletion when photos are using the category", async () => {
        mockPrisma.photoCategory.findUnique.mockResolvedValue({ id: 1, name: "Test" });
        mockPrisma.photo.count.mockResolvedValue(5);

        const response = await deletePhotoCategory(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "1" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("無法刪除");
      });

      it("should handle not found error", async () => {
        mockPrisma.photoCategory.findUnique.mockResolvedValue({ id: 1, name: "Test" });
        mockPrisma.photo.count.mockResolvedValue(0);
        mockPrisma.photoCategory.delete.mockRejectedValue({ code: "P2025" });

        const response = await deletePhotoCategory(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "999" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Category not found");
      });

      it("should handle general errors", async () => {
        mockPrisma.photoCategory.findUnique.mockResolvedValue({ id: 1, name: "Test" });
        mockPrisma.photo.count.mockResolvedValue(0);
        mockPrisma.photoCategory.delete.mockRejectedValue(new Error("DB error"));

        const response = await deletePhotoCategory(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "1" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to delete photo category");
      });
    });
  });

  describe("Article Categories", () => {
    describe("GET /api/articles/categories", () => {
      it("should return article categories", async () => {
        mockPrisma.articleCategory.findMany.mockResolvedValue([
          { id: 1, name: "Tips", slug: "tips", sortOrder: 0 },
        ]);

        const response = await getArticleCategories();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(1);
      });

      it("should handle errors", async () => {
        mockPrisma.articleCategory.findMany.mockRejectedValue(new Error("DB error"));

        const response = await getArticleCategories();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to fetch article categories");
      });
    });

    describe("POST /api/articles/categories", () => {
      it("should create an article category", async () => {
        mockPrisma.articleCategory.create.mockResolvedValue({
          id: 1, name: "New Category", slug: "new-category", sortOrder: 0
        });

        const request = new NextRequest("http://localhost/api/articles/categories", {
          method: "POST",
          body: JSON.stringify({ name: "New Category", slug: "new-category" }),
        });

        const response = await postArticleCategory(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.name).toBe("New Category");
      });

      it("should auto-generate slug when not provided", async () => {
        mockPrisma.articleCategory.create.mockResolvedValue({
          id: 1, name: "Tech Tips", slug: "tech-tips", sortOrder: 0
        });

        const request = new NextRequest("http://localhost/api/articles/categories", {
          method: "POST",
          body: JSON.stringify({ name: "Tech Tips" }),
        });

        const response = await postArticleCategory(request);
        await response.json();

        expect(response.status).toBe(201);
        expect(mockPrisma.articleCategory.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            slug: "tech-tips",
          }),
        });
      });

      it("should return error for missing name", async () => {
        const request = new NextRequest("http://localhost/api/articles/categories", {
          method: "POST",
          body: JSON.stringify({ slug: "test" }),
        });

        const response = await postArticleCategory(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Category name is required");
      });

      it("should handle errors", async () => {
        mockPrisma.articleCategory.create.mockRejectedValue(new Error("DB error"));

        const request = new NextRequest("http://localhost/api/articles/categories", {
          method: "POST",
          body: JSON.stringify({ name: "Test", slug: "test" }),
        });

        const response = await postArticleCategory(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to create article category");
      });

      it("should return error for duplicate category", async () => {
        mockPrisma.articleCategory.create.mockRejectedValue({ code: "P2002" });

        const request = new NextRequest("http://localhost/api/articles/categories", {
          method: "POST",
          body: JSON.stringify({ name: "Duplicate", slug: "duplicate" }),
        });

        const response = await postArticleCategory(request);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe("Category already exists");
      });
    });

    describe("PUT /api/articles/categories/[id]", () => {
      it("should update an article category", async () => {
        mockPrisma.articleCategory.update.mockResolvedValue({
          id: 1, name: "Updated", slug: "updated", sortOrder: 1
        });

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated", slug: "updated", sortOrder: 1 }),
        });

        const response = await putArticleCategory(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.name).toBe("Updated");
      });

      it("should return error for invalid ID", async () => {
        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        });

        const response = await putArticleCategory(request, { params: Promise.resolve({ id: "invalid" }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid category ID");
      });

      it("should return error for missing name", async () => {
        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ slug: "test" }),
        });

        const response = await putArticleCategory(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Category name is required");
      });

      it("should handle duplicate name error", async () => {
        mockPrisma.articleCategory.update.mockRejectedValue({ code: "P2002" });

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Duplicate" }),
        });

        const response = await putArticleCategory(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe("Category name already exists");
      });

      it("should handle not found error", async () => {
        mockPrisma.articleCategory.update.mockRejectedValue({ code: "P2025" });

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        });

        const response = await putArticleCategory(request, { params: Promise.resolve({ id: "999" }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Category not found");
      });

      it("should handle general errors", async () => {
        mockPrisma.articleCategory.update.mockRejectedValue(new Error("DB error"));

        const request = new NextRequest("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        });

        const response = await putArticleCategory(request, { params: Promise.resolve({ id: "1" }) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to update article category");
      });
    });

    describe("DELETE /api/articles/categories/[id]", () => {
      it("should delete an article category", async () => {
        mockPrisma.articleCategory.findUnique.mockResolvedValue({ id: 1, name: "Test" });
        mockPrisma.article.count.mockResolvedValue(0);
        mockPrisma.articleCategory.delete.mockResolvedValue({ id: 1 });

        const response = await deleteArticleCategory(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "1" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it("should return error for invalid ID", async () => {
        const response = await deleteArticleCategory(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "invalid" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid category ID");
      });

      it("should prevent deletion when articles are using the category", async () => {
        mockPrisma.articleCategory.findUnique.mockResolvedValue({ id: 1, name: "Test" });
        mockPrisma.article.count.mockResolvedValue(3);

        const response = await deleteArticleCategory(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "1" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("無法刪除");
      });

      it("should handle not found error", async () => {
        mockPrisma.articleCategory.findUnique.mockResolvedValue({ id: 1, name: "Test" });
        mockPrisma.article.count.mockResolvedValue(0);
        mockPrisma.articleCategory.delete.mockRejectedValue({ code: "P2025" });

        const response = await deleteArticleCategory(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "999" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Category not found");
      });

      it("should handle general errors", async () => {
        mockPrisma.articleCategory.findUnique.mockResolvedValue({ id: 1, name: "Test" });
        mockPrisma.article.count.mockResolvedValue(0);
        mockPrisma.articleCategory.delete.mockRejectedValue(new Error("DB error"));

        const response = await deleteArticleCategory(
          new NextRequest("http://localhost"),
          { params: Promise.resolve({ id: "1" }) }
        );
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to delete article category");
      });
    });
  });
});
