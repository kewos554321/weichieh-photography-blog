import { describe, it, expect, vi, beforeEach } from "vitest";

// Create a mock class for PrismaClient
class MockPrismaClient {
  $connect = vi.fn();
  $disconnect = vi.fn();
}

// Mock PrismaClient
vi.mock("@prisma/client", () => ({
  PrismaClient: MockPrismaClient,
}));

describe("prisma", () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear global prisma
    const globalForPrisma = globalThis as unknown as {
      prisma: unknown;
    };
    delete globalForPrisma.prisma;
  });

  it("should export prisma client", async () => {
    const { prisma } = await import("@/lib/prisma");
    expect(prisma).toBeDefined();
    expect(prisma).toBeInstanceOf(MockPrismaClient);
  });

  it("should reuse global prisma in non-production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const { prisma: prisma1 } = await import("@/lib/prisma");

    // Check global is set
    const globalForPrisma = globalThis as unknown as {
      prisma: unknown;
    };
    expect(globalForPrisma.prisma).toBe(prisma1);

    process.env.NODE_ENV = originalEnv;
  });

  it("should not set global prisma in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    // Clear global first
    const globalForPrisma = globalThis as unknown as {
      prisma: unknown;
    };
    delete globalForPrisma.prisma;

    await import("@/lib/prisma");

    // In production, global should not be set
    expect(globalForPrisma.prisma).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });
});
