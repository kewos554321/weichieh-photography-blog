import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import {
  generateSlugFromTitle,
  generateUniquePhotoSlug,
  generateUniqueArticleSlug,
  generateUniqueAlbumSlug,
} from "@/lib/slug";

describe("slug utilities", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("generateSlugFromTitle", () => {
    it("should convert title to lowercase", () => {
      expect(generateSlugFromTitle("Hello World")).toBe("hello-world");
    });

    it("should replace spaces with hyphens", () => {
      expect(generateSlugFromTitle("hello world test")).toBe("hello-world-test");
    });

    it("should replace underscores with hyphens", () => {
      expect(generateSlugFromTitle("hello_world_test")).toBe("hello-world-test");
    });

    it("should remove special characters", () => {
      expect(generateSlugFromTitle("hello@world!")).toBe("helloworld");
    });

    it("should remove Chinese characters", () => {
      expect(generateSlugFromTitle("hello世界")).toBe("hello");
    });

    it("should remove multiple hyphens", () => {
      expect(generateSlugFromTitle("hello---world")).toBe("hello-world");
    });

    it("should remove leading and trailing hyphens", () => {
      expect(generateSlugFromTitle("-hello-world-")).toBe("hello-world");
    });

    it("should handle empty string", () => {
      expect(generateSlugFromTitle("")).toBe("");
    });

    it("should handle only Chinese characters", () => {
      expect(generateSlugFromTitle("你好世界")).toBe("");
    });

    it("should trim whitespace", () => {
      expect(generateSlugFromTitle("  hello world  ")).toBe("hello-world");
    });
  });

  describe("generateUniquePhotoSlug", () => {
    it("should generate slug from title", async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(null);

      const slug = await generateUniquePhotoSlug("Test Photo");

      expect(slug).toBe("test-photo");
      expect(mockPrisma.photo.findUnique).toHaveBeenCalledWith({
        where: { slug: "test-photo" },
        select: { slug: true },
      });
    });

    it("should append counter if slug exists", async () => {
      mockPrisma.photo.findUnique
        .mockResolvedValueOnce({ slug: "test-photo" }) // First check: exists
        .mockResolvedValueOnce(null); // Second check: doesn't exist

      const slug = await generateUniquePhotoSlug("Test Photo");

      expect(slug).toBe("test-photo-1");
    });

    it("should keep incrementing counter until unique", async () => {
      mockPrisma.photo.findUnique
        .mockResolvedValueOnce({ slug: "test-photo" })
        .mockResolvedValueOnce({ slug: "test-photo-1" })
        .mockResolvedValueOnce({ slug: "test-photo-2" })
        .mockResolvedValueOnce(null);

      const slug = await generateUniquePhotoSlug("Test Photo");

      expect(slug).toBe("test-photo-3");
    });

    it("should exclude current slug when updating", async () => {
      mockPrisma.photo.findUnique.mockResolvedValue({ slug: "test-photo" });

      const slug = await generateUniquePhotoSlug("Test Photo", "test-photo");

      expect(slug).toBe("test-photo");
    });

    it("should use timestamp for Chinese-only titles", async () => {
      const before = Date.now();
      const slug = await generateUniquePhotoSlug("你好世界");
      const after = Date.now();

      expect(slug).toMatch(/^photo-\d+$/);
      const timestamp = parseInt(slug.replace("photo-", ""));
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("generateUniqueArticleSlug", () => {
    it("should generate slug from title", async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const slug = await generateUniqueArticleSlug("Test Article");

      expect(slug).toBe("test-article");
    });

    it("should append counter if slug exists", async () => {
      mockPrisma.article.findUnique
        .mockResolvedValueOnce({ slug: "test-article" })
        .mockResolvedValueOnce(null);

      const slug = await generateUniqueArticleSlug("Test Article");

      expect(slug).toBe("test-article-1");
    });

    it("should exclude current slug when updating", async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ slug: "test-article" });

      const slug = await generateUniqueArticleSlug("Test Article", "test-article");

      expect(slug).toBe("test-article");
    });

    it("should use timestamp for Chinese-only titles", async () => {
      const before = Date.now();
      const slug = await generateUniqueArticleSlug("攝影技巧");
      const after = Date.now();

      expect(slug).toMatch(/^article-\d+$/);
      const timestamp = parseInt(slug.replace("article-", ""));
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("generateUniqueAlbumSlug", () => {
    it("should generate slug from name", async () => {
      mockPrisma.album.findUnique.mockResolvedValue(null);

      const slug = await generateUniqueAlbumSlug("Test Album");

      expect(slug).toBe("test-album");
    });

    it("should append counter if slug exists", async () => {
      mockPrisma.album.findUnique
        .mockResolvedValueOnce({ slug: "test-album" })
        .mockResolvedValueOnce(null);

      const slug = await generateUniqueAlbumSlug("Test Album");

      expect(slug).toBe("test-album-1");
    });

    it("should exclude current slug when updating", async () => {
      mockPrisma.album.findUnique.mockResolvedValue({ slug: "test-album" });

      const slug = await generateUniqueAlbumSlug("Test Album", "test-album");

      expect(slug).toBe("test-album");
    });

    it("should use timestamp for Chinese-only names", async () => {
      const before = Date.now();
      const slug = await generateUniqueAlbumSlug("相簿");
      const after = Date.now();

      expect(slug).toMatch(/^album-\d+$/);
      const timestamp = parseInt(slug.replace("album-", ""));
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });
});
