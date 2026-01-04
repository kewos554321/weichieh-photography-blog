import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExifExtraction } from "@/hooks/useExifExtraction";

// Mock the exif lib
const mockExtractExif = vi.fn();
vi.mock("@/lib/exif", () => ({
  extractExif: (...args: unknown[]) => mockExtractExif(...args),
}));

describe("useExifExtraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial state", () => {
    const { result } = renderHook(() => useExifExtraction());

    expect(result.current.exifData).toBe(null);
    expect(result.current.isExtracting).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.extract).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });

  it("should extract EXIF data successfully", async () => {
    const mockExifData = {
      camera: "Sony A7IV",
      aperture: "f/2.8",
      iso: "ISO 400",
    };
    mockExtractExif.mockResolvedValueOnce(mockExifData);

    const { result } = renderHook(() => useExifExtraction());
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });

    let extractedData: unknown;
    await act(async () => {
      extractedData = await result.current.extract(file);
    });

    expect(result.current.exifData).toEqual(mockExifData);
    expect(extractedData).toEqual(mockExifData);
    expect(result.current.isExtracting).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should set isExtracting to true during extraction", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockExtractExif.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useExifExtraction());
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });

    act(() => {
      result.current.extract(file);
    });

    expect(result.current.isExtracting).toBe(true);

    await act(async () => {
      resolvePromise!({});
    });

    expect(result.current.isExtracting).toBe(false);
  });

  it("should handle extraction error with Error object", async () => {
    mockExtractExif.mockRejectedValueOnce(new Error("Failed to parse EXIF"));

    const { result } = renderHook(() => useExifExtraction());
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });

    let extractedData: unknown;
    await act(async () => {
      extractedData = await result.current.extract(file);
    });

    expect(result.current.error).toBe("Failed to parse EXIF");
    expect(result.current.exifData).toBe(null);
    expect(extractedData).toEqual({});
    expect(result.current.isExtracting).toBe(false);
  });

  it("should handle extraction error with non-Error object", async () => {
    mockExtractExif.mockRejectedValueOnce("string error");

    const { result } = renderHook(() => useExifExtraction());
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });

    let extractedData: unknown;
    await act(async () => {
      extractedData = await result.current.extract(file);
    });

    expect(result.current.error).toBe("Failed to extract EXIF");
    expect(extractedData).toEqual({});
  });

  it("should reset state", async () => {
    const mockExifData = { camera: "Sony A7IV" };
    mockExtractExif.mockResolvedValueOnce(mockExifData);

    const { result } = renderHook(() => useExifExtraction());
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.extract(file);
    });

    expect(result.current.exifData).toEqual(mockExifData);

    act(() => {
      result.current.reset();
    });

    expect(result.current.exifData).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it("should reset error when extracting again", async () => {
    mockExtractExif
      .mockRejectedValueOnce(new Error("First error"))
      .mockResolvedValueOnce({ camera: "Sony" });

    const { result } = renderHook(() => useExifExtraction());
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });

    // First extraction fails
    await act(async () => {
      await result.current.extract(file);
    });

    expect(result.current.error).toBe("First error");

    // Second extraction succeeds
    await act(async () => {
      await result.current.extract(file);
    });

    expect(result.current.error).toBe(null);
    expect(result.current.exifData).toEqual({ camera: "Sony" });
  });
});
