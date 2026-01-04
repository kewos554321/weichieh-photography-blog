import { describe, it, expect } from "vitest";
import { BeforeAfterSlider, LikeButton } from "@/components/photo";

describe("photo index", () => {
  it("should export BeforeAfterSlider", () => {
    expect(BeforeAfterSlider).toBeDefined();
  });

  it("should export LikeButton", () => {
    expect(LikeButton).toBeDefined();
  });
});
