import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  applyWatermark,
  defaultWatermarkSettings,
  WatermarkSettings,
  WatermarkPosition,
} from "@/lib/watermark";

// Mock canvas context
const mockCtx = {
  drawImage: vi.fn(),
  fillText: vi.fn(),
  font: "",
  textAlign: "left" as CanvasTextAlign,
  textBaseline: "top" as CanvasTextBaseline,
  globalAlpha: 1,
  shadowColor: "",
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  fillStyle: "",
};

// Mock canvas
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockCtx),
  toBlob: vi.fn((callback: (blob: Blob | null) => void) => {
    callback(new Blob(["test"], { type: "image/jpeg" }));
  }),
};

describe("watermark", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock document.createElement
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") {
        return mockCanvas as unknown as HTMLCanvasElement;
      }
      return document.createElement(tagName);
    });

    // Mock URL.createObjectURL
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

    // Reset mock canvas
    mockCanvas.width = 0;
    mockCanvas.height = 0;
    Object.assign(mockCtx, {
      drawImage: vi.fn(),
      fillText: vi.fn(),
      font: "",
      textAlign: "left",
      textBaseline: "top",
      globalAlpha: 1,
      shadowColor: "",
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      fillStyle: "",
    });
  });

  describe("defaultWatermarkSettings", () => {
    it("should have correct default values", () => {
      expect(defaultWatermarkSettings).toEqual({
        enabled: false,
        type: "text",
        text: "© My Photography",
        logoUrl: null,
        position: "bottom-right",
        opacity: 30,
        size: "medium",
        padding: 20,
      });
    });
  });

  describe("applyWatermark", () => {
    it("should return original file if watermark is disabled", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const settings: WatermarkSettings = {
        ...defaultWatermarkSettings,
        enabled: false,
      };

      const result = await applyWatermark(file, settings);

      expect(result).toBe(file);
    });

    it("should apply text watermark", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const settings: WatermarkSettings = {
        ...defaultWatermarkSettings,
        enabled: true,
        type: "text",
        text: "© Test",
        position: "bottom-right",
      };

      // Mock Image
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        width: 1000,
        height: 800,
        src: "",
      };

      vi.spyOn(window, "Image").mockImplementation(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload();
        }, 0);
        return mockImage as unknown as HTMLImageElement;
      });

      const resultPromise = applyWatermark(file, settings);

      const result = await resultPromise;

      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe("photo.jpg");
    });

    it("should apply logo watermark", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const settings: WatermarkSettings = {
        ...defaultWatermarkSettings,
        enabled: true,
        type: "logo",
        logoUrl: "https://example.com/logo.png",
        position: "bottom-right",
      };

      // Mock main Image
      const mockMainImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        width: 1000,
        height: 800,
        src: "",
      };

      // Mock logo Image
      const mockLogoImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        width: 100,
        height: 50,
        crossOrigin: "",
        src: "",
      };

      let imageCallCount = 0;
      vi.spyOn(window, "Image").mockImplementation(() => {
        imageCallCount++;
        if (imageCallCount === 1) {
          setTimeout(() => {
            if (mockMainImage.onload) mockMainImage.onload();
          }, 0);
          return mockMainImage as unknown as HTMLImageElement;
        } else {
          setTimeout(() => {
            if (mockLogoImage.onload) mockLogoImage.onload();
          }, 0);
          return mockLogoImage as unknown as HTMLImageElement;
        }
      });

      const result = await applyWatermark(file, settings);

      expect(result).toBeInstanceOf(File);
    });

    it("should reject if image fails to load", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const settings: WatermarkSettings = {
        ...defaultWatermarkSettings,
        enabled: true,
      };

      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: "",
      };

      vi.spyOn(window, "Image").mockImplementation(() => {
        setTimeout(() => {
          if (mockImage.onerror) mockImage.onerror();
        }, 0);
        return mockImage as unknown as HTMLImageElement;
      });

      await expect(applyWatermark(file, settings)).rejects.toThrow("Failed to load image");
    });

    it("should reject if canvas context is null", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const settings: WatermarkSettings = {
        ...defaultWatermarkSettings,
        enabled: true,
      };

      mockCanvas.getContext = vi.fn(() => null);

      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        width: 1000,
        height: 800,
        src: "",
      };

      vi.spyOn(window, "Image").mockImplementation(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload();
        }, 0);
        return mockImage as unknown as HTMLImageElement;
      });

      await expect(applyWatermark(file, settings)).rejects.toThrow("Could not get canvas context");
    });

    it("should reject if blob creation fails", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const settings: WatermarkSettings = {
        ...defaultWatermarkSettings,
        enabled: true,
      };

      mockCanvas.toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
        callback(null);
      });

      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        width: 1000,
        height: 800,
        src: "",
      };

      vi.spyOn(window, "Image").mockImplementation(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload();
        }, 0);
        return mockImage as unknown as HTMLImageElement;
      });

      await expect(applyWatermark(file, settings)).rejects.toThrow("Failed to create blob");
    });

    it("should reject if logo fails to load", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const settings: WatermarkSettings = {
        ...defaultWatermarkSettings,
        enabled: true,
        type: "logo",
        logoUrl: "https://example.com/logo.png",
      };

      let imageCallCount = 0;
      vi.spyOn(window, "Image").mockImplementation(() => {
        imageCallCount++;
        const img = {
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null,
          width: 1000,
          height: 800,
          crossOrigin: "",
          src: "",
        };

        setTimeout(() => {
          if (imageCallCount === 1) {
            if (img.onload) img.onload();
          } else {
            if (img.onerror) img.onerror();
          }
        }, 0);

        return img as unknown as HTMLImageElement;
      });

      await expect(applyWatermark(file, settings)).rejects.toThrow("Failed to load logo");
    });

    it("should not apply logo if logoUrl is null", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const settings: WatermarkSettings = {
        ...defaultWatermarkSettings,
        enabled: true,
        type: "logo",
        logoUrl: null,
      };

      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        width: 1000,
        height: 800,
        src: "",
      };

      vi.spyOn(window, "Image").mockImplementation(() => {
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload();
        }, 0);
        return mockImage as unknown as HTMLImageElement;
      });

      const result = await applyWatermark(file, settings);

      expect(result).toBeInstanceOf(File);
      expect(mockCtx.drawImage).toHaveBeenCalledTimes(1); // Only main image, no logo
    });

    it("should handle different positions", async () => {
      const positions: WatermarkPosition[] = [
        "top-left", "top-center", "top-right",
        "center-left", "center", "center-right",
        "bottom-left", "bottom-center", "bottom-right",
      ];

      for (const position of positions) {
        const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
        const settings: WatermarkSettings = {
          ...defaultWatermarkSettings,
          enabled: true,
          position,
        };

        const mockImage = {
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null,
          width: 1000,
          height: 800,
          src: "",
        };

        vi.spyOn(window, "Image").mockImplementation(() => {
          setTimeout(() => {
            if (mockImage.onload) mockImage.onload();
          }, 0);
          return mockImage as unknown as HTMLImageElement;
        });

        const result = await applyWatermark(file, settings);
        expect(result).toBeInstanceOf(File);
      }
    });

    it("should handle different sizes", async () => {
      const sizes: ("small" | "medium" | "large")[] = ["small", "medium", "large"];

      for (const size of sizes) {
        const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
        const settings: WatermarkSettings = {
          ...defaultWatermarkSettings,
          enabled: true,
          size,
        };

        const mockImage = {
          onload: null as (() => void) | null,
          onerror: null as (() => void) | null,
          width: 1000,
          height: 800,
          src: "",
        };

        vi.spyOn(window, "Image").mockImplementation(() => {
          setTimeout(() => {
            if (mockImage.onload) mockImage.onload();
          }, 0);
          return mockImage as unknown as HTMLImageElement;
        });

        const result = await applyWatermark(file, settings);
        expect(result).toBeInstanceOf(File);
      }
    });
  });
});
