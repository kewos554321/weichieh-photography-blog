import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractExif, formatExifSummary } from "@/lib/exif";

// Mock exifr
const mockParse = vi.fn();
vi.mock("exifr", () => ({
  default: {
    parse: (...args: unknown[]) => mockParse(...args),
  },
}));

describe("exif", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractExif", () => {
    it("should return empty object when no EXIF data", async () => {
      mockParse.mockResolvedValueOnce(null);

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result).toEqual({});
    });

    it("should extract camera info (Make + Model)", async () => {
      mockParse.mockResolvedValueOnce({
        Make: "Sony",
        Model: "ILCE-7M4",
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.camera).toBe("Sony ILCE-7M4");
    });

    it("should avoid duplicating Make in Model", async () => {
      mockParse.mockResolvedValueOnce({
        Make: "Sony",
        Model: "Sony ILCE-7M4",
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.camera).toBe("Sony ILCE-7M4");
    });

    it("should handle only Make without Model", async () => {
      mockParse.mockResolvedValueOnce({
        Make: "Sony",
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.camera).toBe("Sony");
    });

    it("should handle only Model without Make", async () => {
      mockParse.mockResolvedValueOnce({
        Model: "ILCE-7M4",
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.camera).toBe("ILCE-7M4");
    });

    it("should extract lens from LensModel", async () => {
      mockParse.mockResolvedValueOnce({
        LensModel: "FE 24-70mm F2.8 GM II",
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.lens).toBe("FE 24-70mm F2.8 GM II");
    });

    it("should fallback to LensMake if no LensModel", async () => {
      mockParse.mockResolvedValueOnce({
        LensMake: "Sony",
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.lens).toBe("Sony");
    });

    it("should extract aperture", async () => {
      mockParse.mockResolvedValueOnce({
        FNumber: 2.8,
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.aperture).toBe("f/2.8");
    });

    it("should extract shutter speed less than 1 second", async () => {
      mockParse.mockResolvedValueOnce({
        ExposureTime: 0.004, // 1/250
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.shutterSpeed).toBe("1/250s");
    });

    it("should extract shutter speed 1 second or more", async () => {
      mockParse.mockResolvedValueOnce({
        ExposureTime: 2,
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.shutterSpeed).toBe("2s");
    });

    it("should extract ISO", async () => {
      mockParse.mockResolvedValueOnce({
        ISO: 400,
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.iso).toBe("ISO 400");
    });

    it("should extract focal length", async () => {
      mockParse.mockResolvedValueOnce({
        FocalLength: 50,
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.focalLength).toBe("50mm");
    });

    it("should extract date", async () => {
      mockParse.mockResolvedValueOnce({
        DateTimeOriginal: new Date("2024-06-15T12:30:00"),
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.date).toBe("2024-06-15");
    });

    it("should handle invalid date", async () => {
      mockParse.mockResolvedValueOnce({
        DateTimeOriginal: "invalid date",
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.date).toBeUndefined();
    });

    it("should extract GPS coordinates", async () => {
      mockParse.mockResolvedValueOnce({
        latitude: 25.033,
        longitude: 121.565,
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.latitude).toBe(25.033);
      expect(result.longitude).toBe(121.565);
    });

    it("should not include GPS if only latitude is present", async () => {
      mockParse.mockResolvedValueOnce({
        latitude: 25.033,
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result.latitude).toBeUndefined();
      expect(result.longitude).toBeUndefined();
    });

    it("should handle parse errors gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockParse.mockRejectedValueOnce(new Error("Parse error"));

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith("Failed to extract EXIF:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("should extract all data together", async () => {
      mockParse.mockResolvedValueOnce({
        Make: "Sony",
        Model: "ILCE-7M4",
        LensModel: "FE 85mm F1.4 GM",
        FNumber: 1.4,
        ExposureTime: 0.002,
        ISO: 200,
        FocalLength: 85,
        DateTimeOriginal: new Date("2024-06-15"),
        latitude: 25.0,
        longitude: 121.5,
      });

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const result = await extractExif(file);

      expect(result).toEqual({
        camera: "Sony ILCE-7M4",
        lens: "FE 85mm F1.4 GM",
        aperture: "f/1.4",
        shutterSpeed: "1/500s",
        iso: "ISO 200",
        focalLength: "85mm",
        date: "2024-06-15",
        latitude: 25.0,
        longitude: 121.5,
      });
    });
  });

  describe("formatExifSummary", () => {
    it("should format all fields", () => {
      const exif = {
        aperture: "f/2.8",
        shutterSpeed: "1/250s",
        iso: "ISO 400",
        focalLength: "50mm",
      };

      const result = formatExifSummary(exif);

      expect(result).toBe("f/2.8 · 1/250s · ISO 400 · 50mm");
    });

    it("should handle missing fields", () => {
      const exif = {
        aperture: "f/2.8",
        iso: "ISO 400",
      };

      const result = formatExifSummary(exif);

      expect(result).toBe("f/2.8 · ISO 400");
    });

    it("should return empty string for empty exif", () => {
      const result = formatExifSummary({});

      expect(result).toBe("");
    });

    it("should handle single field", () => {
      const result = formatExifSummary({ aperture: "f/1.4" });

      expect(result).toBe("f/1.4");
    });
  });
});
