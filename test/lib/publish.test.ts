import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Need to re-import after mocking to get fresh module state
let publishScheduledContent: typeof import("@/lib/publish").publishScheduledContent;
let checkAndPublish: typeof import("@/lib/publish").checkAndPublish;
let publishSinglePhoto: typeof import("@/lib/publish").publishSinglePhoto;
let publishSingleArticle: typeof import("@/lib/publish").publishSingleArticle;
let schedulePhoto: typeof import("@/lib/publish").schedulePhoto;
let scheduleArticle: typeof import("@/lib/publish").scheduleArticle;
let unschedulePhoto: typeof import("@/lib/publish").unschedulePhoto;
let unscheduleArticle: typeof import("@/lib/publish").unscheduleArticle;

describe("Publish Library", () => {
  beforeEach(async () => {
    resetMocks();
    vi.useFakeTimers();
    vi.resetModules();

    // Re-import to reset lastCheck state
    const publishModule = await import("@/lib/publish");
    publishScheduledContent = publishModule.publishScheduledContent;
    checkAndPublish = publishModule.checkAndPublish;
    publishSinglePhoto = publishModule.publishSinglePhoto;
    publishSingleArticle = publishModule.publishSingleArticle;
    schedulePhoto = publishModule.schedulePhoto;
    scheduleArticle = publishModule.scheduleArticle;
    unschedulePhoto = publishModule.unschedulePhoto;
    unscheduleArticle = publishModule.unscheduleArticle;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("publishScheduledContent", () => {
    it("should update scheduled articles and photos to published", async () => {
      mockPrisma.article.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 3 });

      const result = await publishScheduledContent();

      expect(result.publishedArticles).toBe(2);
      expect(result.publishedPhotos).toBe(3);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("should update with correct where clause", async () => {
      mockPrisma.article.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 0 });

      await publishScheduledContent();

      expect(mockPrisma.article.updateMany).toHaveBeenCalledWith({
        where: {
          status: "scheduled",
          publishedAt: { lte: expect.any(Date) },
        },
        data: { status: "published" },
      });

      expect(mockPrisma.photo.updateMany).toHaveBeenCalledWith({
        where: {
          status: "scheduled",
          publishedAt: { lte: expect.any(Date) },
        },
        data: { status: "published" },
      });
    });

    it("should return zero counts when nothing to publish", async () => {
      mockPrisma.article.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 0 });

      const result = await publishScheduledContent();

      expect(result.publishedArticles).toBe(0);
      expect(result.publishedPhotos).toBe(0);
    });
  });

  describe("checkAndPublish", () => {
    it("should publish content on first call", async () => {
      mockPrisma.article.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 1 });

      const result = await checkAndPublish();

      expect(result).not.toBeNull();
      expect(result?.publishedArticles).toBe(1);
      expect(result?.publishedPhotos).toBe(1);
    });

    it("should skip publish if called within 60 seconds", async () => {
      mockPrisma.article.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 1 });

      // First call
      await checkAndPublish();

      // Second call within 60 seconds
      vi.advanceTimersByTime(30 * 1000); // 30 seconds
      const result = await checkAndPublish();

      expect(result).toBeNull();
      expect(mockPrisma.article.updateMany).toHaveBeenCalledTimes(1);
    });

    it("should publish again after 60 seconds", async () => {
      mockPrisma.article.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 0 });

      // First call
      await checkAndPublish();

      // Advance time by 61 seconds
      vi.advanceTimersByTime(61 * 1000);

      // Second call after 60 seconds
      const result = await checkAndPublish();

      expect(result).not.toBeNull();
      expect(mockPrisma.article.updateMany).toHaveBeenCalledTimes(2);
    });

    it("should return null and log error on failure", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockPrisma.article.updateMany.mockRejectedValue(new Error("DB error"));
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 0 });

      const result = await checkAndPublish();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("[Auto-publish] Error:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("should log when content is published", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      mockPrisma.article.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 3 });

      await checkAndPublish();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Auto-publish] Published 2 articles, 3 photos")
      );
      consoleSpy.mockRestore();
    });

    it("should not log when nothing is published", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      mockPrisma.article.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 0 });

      await checkAndPublish();

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("publishSinglePhoto", () => {
    it("should publish a single photo", async () => {
      const mockPhoto = { id: 1, status: "published", publishedAt: new Date() };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      const result = await publishSinglePhoto(1);

      expect(result).toEqual(mockPhoto);
      expect(mockPrisma.photo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: "published",
          publishedAt: expect.any(Date),
        },
      });
    });
  });

  describe("publishSingleArticle", () => {
    it("should publish a single article", async () => {
      const mockArticle = { id: 1, status: "published", publishedAt: new Date() };
      mockPrisma.article.update.mockResolvedValue(mockArticle);

      const result = await publishSingleArticle(1);

      expect(result).toEqual(mockArticle);
      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: "published",
          publishedAt: expect.any(Date),
        },
      });
    });
  });

  describe("schedulePhoto", () => {
    it("should schedule a photo for future publication", async () => {
      const futureDate = new Date("2025-12-31T00:00:00Z");
      const mockPhoto = { id: 1, status: "scheduled", publishedAt: futureDate };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      const result = await schedulePhoto(1, futureDate);

      expect(result).toEqual(mockPhoto);
      expect(mockPrisma.photo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: "scheduled",
          publishedAt: futureDate,
        },
      });
    });
  });

  describe("scheduleArticle", () => {
    it("should schedule an article for future publication", async () => {
      const futureDate = new Date("2025-12-31T00:00:00Z");
      const mockArticle = { id: 1, status: "scheduled", publishedAt: futureDate };
      mockPrisma.article.update.mockResolvedValue(mockArticle);

      const result = await scheduleArticle(1, futureDate);

      expect(result).toEqual(mockArticle);
      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: "scheduled",
          publishedAt: futureDate,
        },
      });
    });
  });

  describe("unschedulePhoto", () => {
    it("should unschedule a photo and set to draft", async () => {
      const mockPhoto = { id: 1, status: "draft", publishedAt: null };
      mockPrisma.photo.update.mockResolvedValue(mockPhoto);

      const result = await unschedulePhoto(1);

      expect(result).toEqual(mockPhoto);
      expect(mockPrisma.photo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: "draft",
          publishedAt: null,
        },
      });
    });
  });

  describe("unscheduleArticle", () => {
    it("should unschedule an article and set to draft", async () => {
      const mockArticle = { id: 1, status: "draft", publishedAt: null };
      mockPrisma.article.update.mockResolvedValue(mockArticle);

      const result = await unscheduleArticle(1);

      expect(result).toEqual(mockArticle);
      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: "draft",
          publishedAt: null,
        },
      });
    });
  });
});
