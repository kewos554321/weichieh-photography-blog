import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/watermark", () => ({
  defaultWatermarkSettings: {
    enabled: false,
    type: "text",
    text: "© My Photography",
    logoUrl: null,
    position: "bottom-right",
    opacity: 30,
    size: "medium",
    padding: 20,
  },
}));

import { GET, PUT } from "@/app/api/settings/watermark/route";

describe("Settings Watermark API", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/settings/watermark", () => {
    it("should return default settings when no settings exist", async () => {
      mockPrisma.siteSettings.findUnique.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual({
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

    it("should return merged settings when settings exist", async () => {
      mockPrisma.siteSettings.findUnique.mockResolvedValue({
        key: "watermark",
        value: {
          enabled: true,
          text: "Custom Watermark",
          opacity: 50,
        },
      });

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual({
        enabled: true,
        type: "text",
        text: "Custom Watermark",
        logoUrl: null,
        position: "bottom-right",
        opacity: 50,
        size: "medium",
        padding: 20,
      });
    });

    it("should handle errors", async () => {
      mockPrisma.siteSettings.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch settings");
    });
  });

  describe("PUT /api/settings/watermark", () => {
    it("should update watermark settings", async () => {
      mockPrisma.siteSettings.findUnique.mockResolvedValue(null);
      mockPrisma.siteSettings.upsert.mockResolvedValue({});

      const request = new Request("http://localhost/api/settings/watermark", {
        method: "PUT",
        body: JSON.stringify({
          enabled: true,
          text: "New Watermark",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(data.enabled).toBe(true);
      expect(data.text).toBe("New Watermark");
    });

    it("should merge with existing settings", async () => {
      mockPrisma.siteSettings.findUnique.mockResolvedValue({
        key: "watermark",
        value: {
          enabled: true,
          text: "Old Watermark",
          opacity: 50,
        },
      });
      mockPrisma.siteSettings.upsert.mockResolvedValue({});

      const request = new Request("http://localhost/api/settings/watermark", {
        method: "PUT",
        body: JSON.stringify({
          text: "New Watermark",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(data.enabled).toBe(true);
      expect(data.text).toBe("New Watermark");
      expect(data.opacity).toBe(50);
    });

    it("should return 400 if opacity is out of range (negative)", async () => {
      const request = new Request("http://localhost/api/settings/watermark", {
        method: "PUT",
        body: JSON.stringify({
          opacity: -1,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Opacity must be between 0 and 100");
    });

    it("should return 400 if opacity is out of range (over 100)", async () => {
      const request = new Request("http://localhost/api/settings/watermark", {
        method: "PUT",
        body: JSON.stringify({
          opacity: 101,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Opacity must be between 0 and 100");
    });

    it("should return 400 if padding is negative", async () => {
      const request = new Request("http://localhost/api/settings/watermark", {
        method: "PUT",
        body: JSON.stringify({
          padding: -5,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Padding must be non-negative");
    });

    it("should handle errors", async () => {
      mockPrisma.siteSettings.findUnique.mockRejectedValue(new Error("DB error"));

      const request = new Request("http://localhost/api/settings/watermark", {
        method: "PUT",
        body: JSON.stringify({
          enabled: true,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update settings");
    });
  });
});
