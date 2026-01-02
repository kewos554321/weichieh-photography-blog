import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
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
});
