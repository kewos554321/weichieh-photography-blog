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
    mockCanvas.getContext = vi.fn(() => mockCtx);
    mockCanvas.toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
      callback(new Blob(["test"], { type: "image/jpeg" }));
    });
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

      // Create a mock Image class
      class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        width = 1000;
        height = 800;
        src = "";

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }

      vi.stubGlobal("Image", MockImage);

      const result = await applyWatermark(file, settings);

      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe("photo.jpg");

      vi.unstubAllGlobals();
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

      let imageCallCount = 0;

      class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        width: number;
        height: number;
        crossOrigin = "";
        src = "";

        constructor() {
          imageCallCount++;
          if (imageCallCount === 1) {
            this.width = 1000;
            this.height = 800;
          } else {
            this.width = 100;
            this.height = 50;
          }
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }

      vi.stubGlobal("Image", MockImage);

      const result = await applyWatermark(file, settings);

      expect(result).toBeInstanceOf(File);

      vi.unstubAllGlobals();
    });

    it("should reject if image fails to load", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const settings: WatermarkSettings = {
        ...defaultWatermarkSettings,
        enabled: true,
      };

      class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = "";

        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      }

      vi.stubGlobal("Image", MockImage);

      await expect(applyWatermark(file, settings)).rejects.toThrow("Failed to load image");

      vi.unstubAllGlobals();
    });

    it("should reject if canvas context is null", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const settings: WatermarkSettings = {
        ...defaultWatermarkSettings,
        enabled: true,
      };

      mockCanvas.getContext = vi.fn(() => null);

      class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        width = 1000;
        height = 800;
        src = "";

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }

      vi.stubGlobal("Image", MockImage);

      await expect(applyWatermark(file, settings)).rejects.toThrow("Could not get canvas context");

      vi.unstubAllGlobals();
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

      class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        width = 1000;
        height = 800;
        src = "";

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }

      vi.stubGlobal("Image", MockImage);

      await expect(applyWatermark(file, settings)).rejects.toThrow("Failed to create blob");

      vi.unstubAllGlobals();
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

      class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        width = 1000;
        height = 800;
        crossOrigin = "";
        src = "";

        constructor() {
          imageCallCount++;
          setTimeout(() => {
            if (imageCallCount === 1) {
              if (this.onload) this.onload();
            } else {
              if (this.onerror) this.onerror();
            }
          }, 0);
        }
      }

      vi.stubGlobal("Image", MockImage);

      await expect(applyWatermark(file, settings)).rejects.toThrow("Failed to load logo");

      vi.unstubAllGlobals();
    });

    it("should not apply logo if logoUrl is null", async () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const settings: WatermarkSettings = {
        ...defaultWatermarkSettings,
        enabled: true,
        type: "logo",
        logoUrl: null,
      };

      class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        width = 1000;
        height = 800;
        src = "";

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }

      vi.stubGlobal("Image", MockImage);

      const result = await applyWatermark(file, settings);

      expect(result).toBeInstanceOf(File);
      expect(mockCtx.drawImage).toHaveBeenCalledTimes(1); // Only main image, no logo

      vi.unstubAllGlobals();
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

        class MockImage {
          onload: (() => void) | null = null;
          onerror: (() => void) | null = null;
          width = 1000;
          height = 800;
          src = "";

          constructor() {
            setTimeout(() => {
              if (this.onload) this.onload();
            }, 0);
          }
        }

        vi.stubGlobal("Image", MockImage);

        const result = await applyWatermark(file, settings);
        expect(result).toBeInstanceOf(File);

        vi.unstubAllGlobals();
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

        class MockImage {
          onload: (() => void) | null = null;
          onerror: (() => void) | null = null;
          width = 1000;
          height = 800;
          src = "";

          constructor() {
            setTimeout(() => {
              if (this.onload) this.onload();
            }, 0);
          }
        }

        vi.stubGlobal("Image", MockImage);

        const result = await applyWatermark(file, settings);
        expect(result).toBeInstanceOf(File);

        vi.unstubAllGlobals();
      }
    });

    it("should handle logo watermark with different positions", async () => {
      const positions: WatermarkPosition[] = [
        "top-left", "top-center", "top-right",
        "center-left", "center", "center-right",
        "bottom-left", "bottom-center", "bottom-right",
      ];

      for (const position of positions) {
        let imageCallCount = 0;

        class MockImage {
          onload: (() => void) | null = null;
          onerror: (() => void) | null = null;
          width: number;
          height: number;
          crossOrigin = "";
          src = "";

          constructor() {
            imageCallCount++;
            if (imageCallCount % 2 === 1) {
              this.width = 1000;
              this.height = 800;
            } else {
              this.width = 100;
              this.height = 50;
            }
            setTimeout(() => {
              if (this.onload) this.onload();
            }, 0);
          }
        }

        vi.stubGlobal("Image", MockImage);

        const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
        const settings: WatermarkSettings = {
          ...defaultWatermarkSettings,
          enabled: true,
          type: "logo",
          logoUrl: "https://example.com/logo.png",
          position,
        };

        const result = await applyWatermark(file, settings);
        expect(result).toBeInstanceOf(File);

        vi.unstubAllGlobals();
        imageCallCount = 0;
      }
    });
  });
});
