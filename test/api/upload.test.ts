import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Use vi.hoisted to ensure mocks are available before vi.mock
const { getSignedUrlMock, MockS3Client, MockPutObjectCommand } = vi.hoisted(
  () => {
    const getSignedUrlMock = vi.fn();
    return {
      getSignedUrlMock,
      MockS3Client: class {},
      MockPutObjectCommand: class {
        constructor(public params: unknown) {}
      },
    };
  }
);

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: MockS3Client,
  PutObjectCommand: MockPutObjectCommand,
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: getSignedUrlMock,
}));

import { POST } from "@/app/api/upload/route";

describe("Upload API", () => {
  beforeEach(() => {
    getSignedUrlMock.mockReset();
    process.env.R2_PUBLIC_URL = "https://test.r2.dev";
    process.env.R2_BUCKET_NAME = "test-bucket";
  });

  describe("POST /api/upload", () => {
    it("should generate presigned URL for photos", async () => {
      getSignedUrlMock.mockResolvedValue("https://presigned.url/upload");

      const request = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        body: JSON.stringify({
          filename: "test-photo.jpg",
          contentType: "image/jpeg",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.presignedUrl).toBe("https://presigned.url/upload");
      expect(data.publicUrl).toContain("https://test.r2.dev/photos/");
      expect(data.key).toContain("photos/");
      expect(data.key).toContain("test-photo.jpg");
    });

    it("should generate presigned URL for articles", async () => {
      getSignedUrlMock.mockResolvedValue("https://presigned.url/upload");

      const request = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        body: JSON.stringify({
          filename: "cover.jpg",
          contentType: "image/jpeg",
          folder: "articles",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.key).toContain("articles/");
    });

    it("should sanitize filename", async () => {
      getSignedUrlMock.mockResolvedValue("https://presigned.url/upload");

      const request = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        body: JSON.stringify({
          filename: "test file (1).jpg",
          contentType: "image/jpeg",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.key).toContain("test-file--1-.jpg");
    });

    it("should include year and month in path", async () => {
      getSignedUrlMock.mockResolvedValue("https://presigned.url/upload");

      const request = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        body: JSON.stringify({
          filename: "test.jpg",
          contentType: "image/jpeg",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");

      expect(data.key).toContain(`photos/${year}/${month}/`);
    });

    it("should return 400 if filename is missing", async () => {
      const request = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        body: JSON.stringify({ contentType: "image/jpeg" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing filename or contentType");
    });

    it("should return 400 if contentType is missing", async () => {
      const request = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        body: JSON.stringify({ filename: "test.jpg" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing filename or contentType");
    });

    it("should handle errors", async () => {
      getSignedUrlMock.mockRejectedValue(new Error("S3 error"));

      const request = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        body: JSON.stringify({
          filename: "test.jpg",
          contentType: "image/jpeg",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to generate upload URL");
    });
  });
});
