import { describe, it, expect } from "vitest";
import {
  defaultWatermarkSettings,
  sizeMultipliers,
} from "@/lib/watermark";

describe("watermark", () => {
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

  describe("sizeMultipliers", () => {
    it("should have correct size multipliers", () => {
      expect(sizeMultipliers).toEqual({
        small: 0.015,
        medium: 0.025,
        large: 0.04,
      });
    });
  });
});
