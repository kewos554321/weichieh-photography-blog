import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { PUT, DELETE } from "@/app/api/comments/[id]/route";

describe("Comments [id] API", () => {
  beforeEach(() => {
    resetMocks();
  });

  const createRequest = (method: string, body?: object) => {
    return new Request("http://localhost/api/comments/1", {
      method,
      ...(body && { body: JSON.stringify(body) }),
    });
  };

  const createParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  describe("PUT /api/comments/[id]", () => {
    it("should update comment status to APPROVED", async () => {
      const mockComment = { id: 1, status: "APPROVED" };
      mockPrisma.comment.update.mockResolvedValue(mockComment);

      const response = await PUT(
        createRequest("PUT", { status: "APPROVED" }),
        createParams("1")
      );
      const data = await response.json();

      expect(data.status).toBe("APPROVED");
      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "APPROVED" },
      });
    });

    it("should update comment status to REJECTED", async () => {
      const mockComment = { id: 1, status: "REJECTED" };
      mockPrisma.comment.update.mockResolvedValue(mockComment);

      const response = await PUT(
        createRequest("PUT", { status: "REJECTED" }),
        createParams("1")
      );
      const data = await response.json();

      expect(data.status).toBe("REJECTED");
    });

    it("should update comment status to PENDING", async () => {
      const mockComment = { id: 1, status: "PENDING" };
      mockPrisma.comment.update.mockResolvedValue(mockComment);

      const response = await PUT(
        createRequest("PUT", { status: "PENDING" }),
        createParams("1")
      );
      const data = await response.json();

      expect(data.status).toBe("PENDING");
    });

    it("should return 400 for invalid status", async () => {
      const response = await PUT(
        createRequest("PUT", { status: "INVALID" }),
        createParams("1")
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid status");
    });

    it("should handle errors", async () => {
      mockPrisma.comment.update.mockRejectedValue(new Error("DB error"));

      const response = await PUT(
        createRequest("PUT", { status: "APPROVED" }),
        createParams("1")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update comment");
    });
  });

  describe("DELETE /api/comments/[id]", () => {
    it("should delete a comment", async () => {
      mockPrisma.comment.delete.mockResolvedValue({ id: 1 });

      const response = await DELETE(createRequest("DELETE"), createParams("1"));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should handle errors", async () => {
      mockPrisma.comment.delete.mockRejectedValue(new Error("DB error"));

      const response = await DELETE(createRequest("DELETE"), createParams("1"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete comment");
    });
  });
});
