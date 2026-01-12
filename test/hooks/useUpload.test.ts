import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useUpload } from "@/hooks/useUpload";

describe("useUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should return initial state", () => {
    const { result } = renderHook(() => useUpload());

    expect(result.current.isUploading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.upload).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });

  it("should upload file successfully", async () => {
    const mockPresignResponse = {
      presignedUrl: "https://r2.test.com/upload",
      publicUrl: "https://r2.dev/photos/test.jpg",
      key: "photos/test.jpg",
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPresignResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    const { result } = renderHook(() => useUpload());
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    let uploadResult: { publicUrl: string; key: string };
    await act(async () => {
      uploadResult = await result.current.upload(file);
    });

    expect(uploadResult!.publicUrl).toBe(mockPresignResponse.publicUrl);
    expect(uploadResult!.key).toBe(mockPresignResponse.key);
    expect(result.current.progress).toBe(100);
    expect(result.current.isUploading).toBe(false);
  });

  it("should handle presign error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Presign failed" }),
    });

    const { result } = renderHook(() => useUpload());
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow(
        "Presign failed"
      );
    });

    expect(result.current.error).toBe("Presign failed");
    expect(result.current.isUploading).toBe(false);
  });

  it("should handle presign error without message", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useUpload());
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow(
        "Failed to get upload URL"
      );
    });

    expect(result.current.error).toBe("Failed to get upload URL");
  });

  it("should handle upload error", async () => {
    const mockPresignResponse = {
      presignedUrl: "https://r2.test.com/upload",
      publicUrl: "https://r2.dev/photos/test.jpg",
      key: "photos/test.jpg",
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPresignResponse),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    const { result } = renderHook(() => useUpload());
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow(
        "Failed to upload file"
      );
    });

    expect(result.current.error).toBe("Failed to upload file");
    expect(result.current.isUploading).toBe(false);
  });

  it("should handle non-Error exceptions", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      "string error"
    );

    const { result } = renderHook(() => useUpload());
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toBe("string error");
    });

    expect(result.current.error).toBe("Upload failed");
  });

  it("should use articles folder when specified", async () => {
    const mockPresignResponse = {
      presignedUrl: "https://r2.test.com/upload",
      publicUrl: "https://r2.dev/articles/test.jpg",
      key: "articles/test.jpg",
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPresignResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    const { result } = renderHook(() => useUpload());
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.upload(file, "articles");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "test.jpg",
        contentType: "image/jpeg",
        folder: "articles",
      }),
    });
  });

  it("should reset state", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Test error" }),
    });

    const { result } = renderHook(() => useUpload());
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await act(async () => {
      try {
        await result.current.upload(file);
      } catch {
        // Expected error
      }
    });

    expect(result.current.error).toBe("Test error");

    act(() => {
      result.current.reset();
    });

    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBe(null);
  });

  describe("uploadBatch", () => {
    it("should return empty array for empty files", async () => {
      const { result } = renderHook(() => useUpload());

      let uploadResults: { filename: string; publicUrl: string; key: string }[];
      await act(async () => {
        uploadResults = await result.current.uploadBatch([]);
      });

      expect(uploadResults!).toEqual([]);
    });

    it("should upload multiple files successfully", async () => {
      const mockBatchResponse = {
        uploads: [
          { presignedUrl: "https://r2.test.com/1", publicUrl: "https://r2.dev/1.jpg", key: "photos/1.jpg", filename: "1.jpg" },
          { presignedUrl: "https://r2.test.com/2", publicUrl: "https://r2.dev/2.jpg", key: "photos/2.jpg", filename: "2.jpg" },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBatchResponse),
        })
        .mockResolvedValue({ ok: true });

      const { result } = renderHook(() => useUpload());
      const files = [
        new File(["test1"], "1.jpg", { type: "image/jpeg" }),
        new File(["test2"], "2.jpg", { type: "image/jpeg" }),
      ];

      let uploadResults: { filename: string; publicUrl: string; key: string }[];
      await act(async () => {
        uploadResults = await result.current.uploadBatch(files);
      });

      expect(uploadResults!).toHaveLength(2);
      expect(uploadResults![0].publicUrl).toBe("https://r2.dev/1.jpg");
      expect(uploadResults![1].publicUrl).toBe("https://r2.dev/2.jpg");
      expect(result.current.progress).toBe(100);
    });

    it("should handle batch presign error", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Batch presign failed" }),
      });

      const { result } = renderHook(() => useUpload());
      const files = [new File(["test"], "test.jpg", { type: "image/jpeg" })];

      await act(async () => {
        await expect(result.current.uploadBatch(files)).rejects.toThrow("Batch presign failed");
      });

      expect(result.current.error).toBe("Batch presign failed");
    });

    it("should handle batch presign error without message", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useUpload());
      const files = [new File(["test"], "test.jpg", { type: "image/jpeg" })];

      await act(async () => {
        await expect(result.current.uploadBatch(files)).rejects.toThrow("Failed to get batch upload URLs");
      });

      expect(result.current.error).toBe("Failed to get batch upload URLs");
    });

    it("should handle individual file upload error in batch", async () => {
      const mockBatchResponse = {
        uploads: [
          { presignedUrl: "https://r2.test.com/1", publicUrl: "https://r2.dev/1.jpg", key: "photos/1.jpg", filename: "1.jpg" },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBatchResponse),
        })
        .mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useUpload());
      const files = [new File(["test"], "test.jpg", { type: "image/jpeg" })];

      await act(async () => {
        await expect(result.current.uploadBatch(files)).rejects.toThrow("Failed to upload test.jpg");
      });

      expect(result.current.error).toBe("Failed to upload test.jpg");
    });

    it("should call progress callback for batch uploads", async () => {
      const mockBatchResponse = {
        uploads: [
          { presignedUrl: "https://r2.test.com/1", publicUrl: "https://r2.dev/1.jpg", key: "photos/1.jpg", filename: "1.jpg" },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBatchResponse),
        })
        .mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useUpload());
      const files = [new File(["test"], "test.jpg", { type: "image/jpeg" })];
      const onProgress = vi.fn();

      await act(async () => {
        await result.current.uploadBatch(files, "photos", onProgress);
      });

      expect(onProgress).toHaveBeenCalledWith(1, 1, "test.jpg");
    });

    it("should handle non-Error exception in batch upload", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce("string error");

      const { result } = renderHook(() => useUpload());
      const files = [new File(["test"], "test.jpg", { type: "image/jpeg" })];

      await act(async () => {
        await expect(result.current.uploadBatch(files)).rejects.toBe("string error");
      });

      expect(result.current.error).toBe("Batch upload failed");
    });
  });
});
