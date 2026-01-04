import { describe, it, expect } from "vitest";
import { CommentForm, CommentList } from "@/components/comments";

describe("comments index", () => {
  it("should export CommentForm", () => {
    expect(CommentForm).toBeDefined();
  });

  it("should export CommentList", () => {
    expect(CommentList).toBeDefined();
  });
});
