import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Need to re-import after mocking to get fresh module state
let publishScheduledContent: typeof import("@/lib/publish").publishScheduledContent;
let checkAndPublish: typeof import("@/lib/publish").checkAndPublish;
let publishSinglePhoto: typeof import("@/lib/publish").publishSinglePhoto;
let publishSinglePost: typeof import("@/lib/publish").publishSinglePost;
let schedulePhoto: typeof import("@/lib/publish").schedulePhoto;
let schedulePost: typeof import("@/lib/publish").schedulePost;
let unschedulePhoto: typeof import("@/lib/publish").unschedulePhoto;
let unschedulePost: typeof import("@/lib/publish").unschedulePost;

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
    publishSinglePost = publishModule.publishSinglePost;
    schedulePhoto = publishModule.schedulePhoto;
    schedulePost = publishModule.schedulePost;
    unschedulePhoto = publishModule.unschedulePhoto;
    unschedulePost = publishModule.unschedulePost;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("publishScheduledContent", () => {
    it("should update scheduled posts and photos to published", async () => {
      mockPrisma.post.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 3 });

      const result = await publishScheduledContent();

      expect(result.publishedPosts).toBe(2);
      expect(result.publishedPhotos).toBe(3);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("should update with correct where clause", async () => {
      mockPrisma.post.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 0 });

      await publishScheduledContent();

      expect(mockPrisma.post.updateMany).toHaveBeenCalledWith({
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
      mockPrisma.post.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 0 });

      const result = await publishScheduledContent();

      expect(result.publishedPosts).toBe(0);
      expect(result.publishedPhotos).toBe(0);
    });
  });

  describe("checkAndPublish", () => {
    it("should publish content on first call", async () => {
      mockPrisma.post.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 1 });

      const result = await checkAndPublish();

      expect(result).not.toBeNull();
      expect(result?.publishedPosts).toBe(1);
      expect(result?.publishedPhotos).toBe(1);
    });

    it("should skip publish if called within 60 seconds", async () => {
      mockPrisma.post.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 1 });

      // First call
      await checkAndPublish();

      // Second call within 60 seconds
      vi.advanceTimersByTime(30 * 1000); // 30 seconds
      const result = await checkAndPublish();

      expect(result).toBeNull();
      expect(mockPrisma.post.updateMany).toHaveBeenCalledTimes(1);
    });

    it("should publish again after 60 seconds", async () => {
      mockPrisma.post.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 0 });

      // First call
      await checkAndPublish();

      // Advance time by 61 seconds
      vi.advanceTimersByTime(61 * 1000);

      // Second call after 60 seconds
      const result = await checkAndPublish();

      expect(result).not.toBeNull();
      expect(mockPrisma.post.updateMany).toHaveBeenCalledTimes(2);
    });

    it("should return null and log error on failure", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockPrisma.post.updateMany.mockRejectedValue(new Error("DB error"));
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 0 });

      const result = await checkAndPublish();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("[Auto-publish] Error:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("should log when content is published", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      mockPrisma.post.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 3 });

      await checkAndPublish();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Auto-publish] Published 2 posts, 3 photos")
      );
      consoleSpy.mockRestore();
    });

    it("should not log when nothing is published", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      mockPrisma.post.updateMany.mockResolvedValue({ count: 0 });
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

  describe("publishSinglePost", () => {
    it("should publish a single post", async () => {
      const mockPost = { id: 1, status: "published", publishedAt: new Date() };
      mockPrisma.post.update.mockResolvedValue(mockPost);

      const result = await publishSinglePost(1);

      expect(result).toEqual(mockPost);
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
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

  describe("schedulePost", () => {
    it("should schedule an post for future publication", async () => {
      const futureDate = new Date("2025-12-31T00:00:00Z");
      const mockPost = { id: 1, status: "scheduled", publishedAt: futureDate };
      mockPrisma.post.update.mockResolvedValue(mockPost);

      const result = await schedulePost(1, futureDate);

      expect(result).toEqual(mockPost);
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
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

  describe("unschedulePost", () => {
    it("should unschedule an post and set to draft", async () => {
      const mockPost = { id: 1, status: "draft", publishedAt: null };
      mockPrisma.post.update.mockResolvedValue(mockPost);

      const result = await unschedulePost(1);

      expect(result).toEqual(mockPost);
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: "draft",
          publishedAt: null,
        },
      });
    });
  });
});
