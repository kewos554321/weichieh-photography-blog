import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Use vi.hoisted to ensure mocks are available before vi.mock
const { mockGetSignedUrl, MockS3Client, MockPutObjectCommand } = vi.hoisted(() => {
  const mockGetSignedUrl = vi.fn();
  return {
    mockGetSignedUrl,
    MockS3Client: class {
      send = vi.fn();
    },
    MockPutObjectCommand: class {
      constructor(public params: unknown) {}
    },
  };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: MockS3Client,
  PutObjectCommand: MockPutObjectCommand,
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

import { POST } from "@/app/api/upload/batch/route";

describe("Batch Upload API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.R2_BUCKET_NAME = "test-bucket";
    process.env.R2_PUBLIC_URL = "https://test.r2.dev";
    mockGetSignedUrl.mockResolvedValue("https://presigned-url.example.com");
  });

  const createRequest = (body: object) => {
    return new NextRequest("http://localhost/api/upload/batch", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  it("should return 400 if files array is missing", async () => {
    const response = await POST(createRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing or empty files array");
  });

  it("should return 400 if files is not an array", async () => {
    const response = await POST(createRequest({ files: "not-an-array" }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing or empty files array");
  });

  it("should return 400 if files array is empty", async () => {
    const response = await POST(createRequest({ files: [] }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing or empty files array");
  });

  it("should return 400 if batch size exceeds limit", async () => {
    const files = Array(21).fill({ filename: "test.jpg", contentType: "image/jpeg" });
    const response = await POST(createRequest({ files }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Batch size exceeds limit of 20 files");
  });

  it("should generate presigned URLs for valid files", async () => {
    const files = [
      { filename: "photo1.jpg", contentType: "image/jpeg" },
      { filename: "photo2.png", contentType: "image/png" },
    ];

    const response = await POST(createRequest({ files }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(2);
    expect(data.uploads).toHaveLength(2);
    expect(data.uploads[0].filename).toBe("photo1.jpg");
    expect(data.uploads[0].presignedUrl).toBe("https://presigned-url.example.com");
    expect(data.uploads[0].publicUrl).toContain("https://test.r2.dev/photos/");
  });

  it("should use custom folder when provided", async () => {
    const files = [{ filename: "article.jpg", contentType: "image/jpeg" }];

    const response = await POST(createRequest({ files, folder: "articles" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.uploads[0].publicUrl).toContain("https://test.r2.dev/articles/");
  });

  it("should sanitize filenames with special characters", async () => {
    const files = [{ filename: "photo with spaces!@#$.jpg", contentType: "image/jpeg" }];

    const response = await POST(createRequest({ files }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.uploads[0].key).not.toContain(" ");
    expect(data.uploads[0].key).not.toContain("!");
    expect(data.uploads[0].key).not.toContain("@");
  });

  it("should handle errors for invalid file info", async () => {
    const files = [
      { filename: "valid.jpg", contentType: "image/jpeg" },
      { filename: "", contentType: "image/jpeg" }, // invalid
    ];

    const response = await POST(createRequest({ files }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to generate batch upload URLs");
  });

  it("should handle errors when getSignedUrl fails", async () => {
    mockGetSignedUrl.mockRejectedValue(new Error("S3 error"));

    const files = [{ filename: "test.jpg", contentType: "image/jpeg" }];
    const response = await POST(createRequest({ files }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to generate batch upload URLs");
  });

  it("should generate unique keys for each file", async () => {
    const files = [
      { filename: "same.jpg", contentType: "image/jpeg" },
      { filename: "same.jpg", contentType: "image/jpeg" },
    ];

    const response = await POST(createRequest({ files }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.uploads[0].key).not.toBe(data.uploads[1].key);
  });
});
