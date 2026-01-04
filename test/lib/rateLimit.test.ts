import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isRateLimited, hashIP, getClientIP } from "@/lib/rateLimit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isRateLimited", () => {
    it("should not be rate limited on first request", () => {
      const result = isRateLimited("test-id-1", { windowMs: 60000, maxRequests: 5 });

      expect(result.limited).toBe(false);
      expect(result.remaining).toBe(4);
    });

    it("should track remaining requests", () => {
      const id = "test-id-2";
      const options = { windowMs: 60000, maxRequests: 3 };

      const result1 = isRateLimited(id, options);
      expect(result1.remaining).toBe(2);

      const result2 = isRateLimited(id, options);
      expect(result2.remaining).toBe(1);

      const result3 = isRateLimited(id, options);
      expect(result3.remaining).toBe(0);
    });

    it("should be rate limited after max requests", () => {
      const id = "test-id-3";
      const options = { windowMs: 60000, maxRequests: 2 };

      isRateLimited(id, options);
      isRateLimited(id, options);
      const result = isRateLimited(id, options);

      expect(result.limited).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it("should reset after window expires", () => {
      const id = "test-id-4";
      const options = { windowMs: 60000, maxRequests: 1 };

      const result1 = isRateLimited(id, options);
      expect(result1.limited).toBe(false);

      const result2 = isRateLimited(id, options);
      expect(result2.limited).toBe(true);

      // Advance time past the window
      vi.advanceTimersByTime(61000);

      const result3 = isRateLimited(id, options);
      expect(result3.limited).toBe(false);
      expect(result3.remaining).toBe(0);
    });

    it("should use default options if not provided", () => {
      const result = isRateLimited("test-id-5");

      expect(result.limited).toBe(false);
      expect(result.remaining).toBe(4); // Default maxRequests is 5
    });

    it("should return resetAt time", () => {
      const now = Date.now();
      const windowMs = 60000;
      const result = isRateLimited("test-id-6", { windowMs, maxRequests: 5 });

      expect(result.resetAt).toBeGreaterThanOrEqual(now + windowMs);
    });

    it("should periodically cleanup expired entries", () => {
      // This tests the cleanup mechanism (1% chance)
      // We need to call many times to trigger cleanup
      const mathRandomSpy = vi.spyOn(Math, "random");

      // First, create an entry
      isRateLimited("cleanup-test", { windowMs: 1000, maxRequests: 5 });

      // Advance time past expiry
      vi.advanceTimersByTime(2000);

      // Mock random to return low value to trigger cleanup
      mathRandomSpy.mockReturnValue(0.005);

      // This should trigger cleanup
      isRateLimited("another-id", { windowMs: 1000, maxRequests: 5 });

      mathRandomSpy.mockRestore();
    });
  });

  describe("hashIP", () => {
    it("should return consistent hash for same IP", () => {
      const hash1 = hashIP("192.168.1.1");
      const hash2 = hashIP("192.168.1.1");

      expect(hash1).toBe(hash2);
    });

    it("should return different hash for different IPs", () => {
      const hash1 = hashIP("192.168.1.1");
      const hash2 = hashIP("192.168.1.2");

      expect(hash1).not.toBe(hash2);
    });

    it("should return a string", () => {
      const hash = hashIP("127.0.0.1");

      expect(typeof hash).toBe("string");
    });

    it("should handle empty string", () => {
      const hash = hashIP("");

      expect(typeof hash).toBe("string");
    });
  });

  describe("getClientIP", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "203.0.113.1, 70.41.3.18, 150.172.238.178",
        },
      });

      const ip = getClientIP(request);

      expect(ip).toBe("203.0.113.1");
    });

    it("should extract IP from x-real-ip header", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-real-ip": "203.0.113.2",
        },
      });

      const ip = getClientIP(request);

      expect(ip).toBe("203.0.113.2");
    });

    it("should prefer x-forwarded-for over x-real-ip", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "203.0.113.1",
          "x-real-ip": "203.0.113.2",
        },
      });

      const ip = getClientIP(request);

      expect(ip).toBe("203.0.113.1");
    });

    it("should return unknown if no IP headers", () => {
      const request = new Request("http://localhost");

      const ip = getClientIP(request);

      expect(ip).toBe("unknown");
    });

    it("should trim whitespace from forwarded IP", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "  203.0.113.1  , 70.41.3.18",
        },
      });

      const ip = getClientIP(request);

      expect(ip).toBe("203.0.113.1");
    });
  });
});
