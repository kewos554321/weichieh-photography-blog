import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET as getProfile, PUT as putProfile } from "@/app/api/settings/profile/route";
import { GET as getSeo, PUT as putSeo } from "@/app/api/settings/seo/route";

describe("Settings API", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("Profile Settings", () => {
    describe("GET /api/settings/profile", () => {
      it("should return default profile when no settings exist", async () => {
        mockPrisma.siteSettings.findUnique.mockResolvedValue(null);

        const response = await getProfile();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.name).toBe("WeiChieh");
        expect(data.title).toBe("Photographer & Writer");
      });

      it("should return stored profile settings", async () => {
        mockPrisma.siteSettings.findUnique.mockResolvedValue({
          key: "profile",
          value: { name: "Custom Name", title: "Custom Title" },
        });

        const response = await getProfile();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.name).toBe("Custom Name");
        expect(data.title).toBe("Custom Title");
      });

      it("should handle errors", async () => {
        mockPrisma.siteSettings.findUnique.mockRejectedValue(new Error("DB error"));

        const response = await getProfile();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to get profile settings");
      });
    });

    describe("PUT /api/settings/profile", () => {
      it("should update profile settings", async () => {
        const profileData = {
          name: "New Name",
          title: "New Title",
          bio: "New bio",
          avatar: "/avatar.jpg",
          email: "test@test.com",
        };

        mockPrisma.siteSettings.upsert.mockResolvedValue({
          key: "profile",
          value: profileData,
        });

        const request = new NextRequest("http://localhost/api/settings/profile", {
          method: "PUT",
          body: JSON.stringify(profileData),
        });

        const response = await putProfile(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.name).toBe("New Name");
      });

      it("should return error when name is missing", async () => {
        const request = new NextRequest("http://localhost/api/settings/profile", {
          method: "PUT",
          body: JSON.stringify({ title: "Test" }),
        });

        const response = await putProfile(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Name and title are required");
      });

      it("should return error when title is missing", async () => {
        const request = new NextRequest("http://localhost/api/settings/profile", {
          method: "PUT",
          body: JSON.stringify({ name: "Test" }),
        });

        const response = await putProfile(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Name and title are required");
      });

      it("should handle errors", async () => {
        mockPrisma.siteSettings.upsert.mockRejectedValue(new Error("DB error"));

        const request = new NextRequest("http://localhost/api/settings/profile", {
          method: "PUT",
          body: JSON.stringify({ name: "Test", title: "Test Title" }),
        });

        const response = await putProfile(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to update profile settings");
      });
    });
  });

  describe("SEO Settings", () => {
    describe("GET /api/settings/seo", () => {
      it("should return default SEO when no settings exist", async () => {
        mockPrisma.siteSettings.findUnique.mockResolvedValue(null);

        const response = await getSeo();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.siteTitle).toBe("WeiChieh Photography");
      });

      it("should return stored SEO settings", async () => {
        mockPrisma.siteSettings.findUnique.mockResolvedValue({
          key: "seo",
          value: { siteTitle: "Custom Title", siteDescription: "Custom Desc" },
        });

        const response = await getSeo();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.siteTitle).toBe("Custom Title");
        expect(data.siteDescription).toBe("Custom Desc");
      });

      it("should handle errors", async () => {
        mockPrisma.siteSettings.findUnique.mockRejectedValue(new Error("DB error"));

        const response = await getSeo();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to get SEO settings");
      });
    });

    describe("PUT /api/settings/seo", () => {
      it("should update SEO settings", async () => {
        const seoData = {
          siteTitle: "New Title",
          siteDescription: "New Description",
          siteKeywords: ["photo", "blog"],
          ogImage: "/og.jpg",
          twitterHandle: "@test",
          googleAnalyticsId: "GA-123",
          googleSearchConsoleId: "GSC-123",
          facebookPixelId: "FB-123",
        };

        mockPrisma.siteSettings.upsert.mockResolvedValue({
          key: "seo",
          value: seoData,
        });

        const request = new NextRequest("http://localhost/api/settings/seo", {
          method: "PUT",
          body: JSON.stringify(seoData),
        });

        const response = await putSeo(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.siteTitle).toBe("New Title");
      });

      it("should use defaults for missing fields", async () => {
        mockPrisma.siteSettings.upsert.mockResolvedValue({
          key: "seo",
          value: {
            siteTitle: "WeiChieh Photography",
            siteDescription: "A photography blog capturing moments and stories through the lens",
            siteKeywords: ["photography", "blog", "portrait", "landscape", "street"],
            ogImage: "",
            twitterHandle: "",
            googleAnalyticsId: "",
            googleSearchConsoleId: "",
            facebookPixelId: "",
          },
        });

        const request = new NextRequest("http://localhost/api/settings/seo", {
          method: "PUT",
          body: JSON.stringify({}),
        });

        const response = await putSeo(request);

        expect(response.status).toBe(200);
      });

      it("should handle errors", async () => {
        mockPrisma.siteSettings.upsert.mockRejectedValue(new Error("DB error"));

        const request = new NextRequest("http://localhost/api/settings/seo", {
          method: "PUT",
          body: JSON.stringify({ siteTitle: "Test" }),
        });

        const response = await putSeo(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to update SEO settings");
      });
    });
  });
});
