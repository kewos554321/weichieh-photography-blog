import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  uploadSingleImage,
  uploadBatchImages,
  uploadBatchImagesSequential,
  validateImageFile,
  validateImageFiles,
} from "@/lib/upload";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Upload Utils", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateImageFile", () => {
    it("should accept valid JPEG file", () => {
      const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept valid PNG file", () => {
      const file = new File(["content"], "test.png", { type: "image/png" });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it("should accept valid WebP file", () => {
      const file = new File(["content"], "test.webp", { type: "image/webp" });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it("should accept valid GIF file", () => {
      const file = new File(["content"], "test.gif", { type: "image/gif" });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it("should reject unsupported file type", () => {
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("不支援的檔案格式");
    });

    it("should reject file exceeding size limit", () => {
      // Create a file larger than 10MB
      const largeContent = new Array(11 * 1024 * 1024).fill("a").join("");
      const file = new File([largeContent], "large.jpg", { type: "image/jpeg" });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("檔案過大");
    });
  });

  describe("validateImageFiles", () => {
    it("should return valid for all valid files", () => {
      const files = [
        new File(["content1"], "test1.jpg", { type: "image/jpeg" }),
        new File(["content2"], "test2.png", { type: "image/png" }),
      ];
      const result = validateImageFiles(files);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return errors for invalid files", () => {
      const files = [
        new File(["content1"], "test1.jpg", { type: "image/jpeg" }),
        new File(["content2"], "test2.pdf", { type: "application/pdf" }),
      ];
      const result = validateImageFiles(files);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("test2.pdf");
    });

    it("should return empty errors for empty array", () => {
      const result = validateImageFiles([]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("uploadSingleImage", () => {
    it("should upload a single image successfully", async () => {
      const file = new File(["content"], "test.jpg", { type: "image/jpeg" });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            presignedUrl: "https://r2.example.com/presigned",
            publicUrl: "https://cdn.example.com/test.jpg",
          }),
        })
        .mockResolvedValueOnce({ ok: true });

      const result = await uploadSingleImage(file);

      expect(result).toBe("https://cdn.example.com/test.jpg");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should throw error when getting presigned URL fails", async () => {
      const file = new File(["content"], "test.jpg", { type: "image/jpeg" });

      mockFetch.mockResolvedValueOnce({ ok: false });

      await expect(uploadSingleImage(file)).rejects.toThrow("Failed to get upload URL");
    });

    it("should throw error when upload fails", async () => {
      const file = new File(["content"], "test.jpg", { type: "image/jpeg" });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            presignedUrl: "https://r2.example.com/presigned",
            publicUrl: "https://cdn.example.com/test.jpg",
          }),
        })
        .mockResolvedValueOnce({ ok: false });

      await expect(uploadSingleImage(file)).rejects.toThrow("Failed to upload file");
    });

    it("should use custom folder", async () => {
      const file = new File(["content"], "test.jpg", { type: "image/jpeg" });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            presignedUrl: "https://r2.example.com/presigned",
            publicUrl: "https://cdn.example.com/avatars/test.jpg",
          }),
        })
        .mockResolvedValueOnce({ ok: true });

      await uploadSingleImage(file, "avatars");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/upload",
        expect.objectContaining({
          body: expect.stringContaining('"folder":"avatars"'),
        })
      );
    });
  });

  describe("uploadBatchImages", () => {
    it("should return empty array for empty files", async () => {
      const result = await uploadBatchImages([]);
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should upload multiple images successfully", async () => {
      const files = [
        new File(["content1"], "test1.jpg", { type: "image/jpeg" }),
        new File(["content2"], "test2.jpg", { type: "image/jpeg" }),
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            count: 2,
            uploads: [
              { presignedUrl: "https://r2.example.com/1", publicUrl: "https://cdn.example.com/1.jpg" },
              { presignedUrl: "https://r2.example.com/2", publicUrl: "https://cdn.example.com/2.jpg" },
            ],
          }),
        })
        .mockResolvedValue({ ok: true });

      const result = await uploadBatchImages(files);

      expect(result).toEqual([
        "https://cdn.example.com/1.jpg",
        "https://cdn.example.com/2.jpg",
      ]);
    });

    it("should call progress callback", async () => {
      const files = [
        new File(["content1"], "test1.jpg", { type: "image/jpeg" }),
        new File(["content2"], "test2.jpg", { type: "image/jpeg" }),
      ];

      const onProgress = vi.fn();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            count: 2,
            uploads: [
              { presignedUrl: "https://r2.example.com/1", publicUrl: "https://cdn.example.com/1.jpg" },
              { presignedUrl: "https://r2.example.com/2", publicUrl: "https://cdn.example.com/2.jpg" },
            ],
          }),
        })
        .mockResolvedValue({ ok: true });

      await uploadBatchImages(files, "photos", onProgress);

      expect(onProgress).toHaveBeenCalled();
    });

    it("should throw error when getting batch URLs fails", async () => {
      const files = [new File(["content"], "test.jpg", { type: "image/jpeg" })];

      mockFetch.mockResolvedValueOnce({ ok: false });

      await expect(uploadBatchImages(files)).rejects.toThrow("Failed to get batch upload URLs");
    });

    it("should throw error when individual upload fails", async () => {
      const files = [new File(["content"], "test.jpg", { type: "image/jpeg" })];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            count: 1,
            uploads: [
              { presignedUrl: "https://r2.example.com/1", publicUrl: "https://cdn.example.com/1.jpg" },
            ],
          }),
        })
        .mockResolvedValueOnce({ ok: false });

      await expect(uploadBatchImages(files)).rejects.toThrow("Failed to upload");
    });
  });

  describe("uploadBatchImagesSequential", () => {
    it("should upload images sequentially", async () => {
      const files = [
        new File(["content1"], "test1.jpg", { type: "image/jpeg" }),
        new File(["content2"], "test2.jpg", { type: "image/jpeg" }),
      ];

      mockFetch
        // First file
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            presignedUrl: "https://r2.example.com/1",
            publicUrl: "https://cdn.example.com/1.jpg",
          }),
        })
        .mockResolvedValueOnce({ ok: true })
        // Second file
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            presignedUrl: "https://r2.example.com/2",
            publicUrl: "https://cdn.example.com/2.jpg",
          }),
        })
        .mockResolvedValueOnce({ ok: true });

      const result = await uploadBatchImagesSequential(files);

      expect(result).toEqual([
        "https://cdn.example.com/1.jpg",
        "https://cdn.example.com/2.jpg",
      ]);
    });

    it("should call progress callback with file name", async () => {
      const files = [new File(["content"], "test.jpg", { type: "image/jpeg" })];
      const onProgress = vi.fn();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            presignedUrl: "https://r2.example.com/1",
            publicUrl: "https://cdn.example.com/1.jpg",
          }),
        })
        .mockResolvedValueOnce({ ok: true });

      await uploadBatchImagesSequential(files, "photos", onProgress);

      expect(onProgress).toHaveBeenCalledWith(0, 1, "test.jpg");
      expect(onProgress).toHaveBeenCalledWith(1, 1, "test.jpg");
    });

    it("should return empty array for empty files", async () => {
      const result = await uploadBatchImagesSequential([]);
      expect(result).toEqual([]);
    });
  });
});
