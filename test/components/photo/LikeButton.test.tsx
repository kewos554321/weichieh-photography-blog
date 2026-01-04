import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LikeButton } from "@/components/photo/LikeButton";

describe("LikeButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should fetch initial like status on mount", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: false, likeCount: 10 }),
    });

    render(<LikeButton photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/photos/test-photo/like");
  });

  it("should show liked state", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: true, likeCount: 5 }),
    });

    render(<LikeButton photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    // Button should have liked styling
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-red-50");
  });

  it("should toggle like on click", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ liked: false, likeCount: 10 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ liked: true, likeCount: 11 }),
      });

    render(<LikeButton photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("11")).toBeInTheDocument();
    });
  });

  it("should show optimistic update before server responds", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ liked: false, likeCount: 10 }),
      })
      .mockReturnValueOnce(promise);

    render(<LikeButton photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Optimistic update should show 11 immediately
    expect(screen.getByText("11")).toBeInTheDocument();

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ liked: true, likeCount: 11 }),
    });
  });

  it("should revert on API error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ liked: false, likeCount: 10 }),
      })
      .mockRejectedValueOnce(new Error("Network error"));

    render(<LikeButton photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Optimistic update
    expect(screen.getByText("11")).toBeInTheDocument();

    // After error, should revert
    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should revert on non-ok response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ liked: false, likeCount: 10 }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(<LikeButton photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // After error, should revert
    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });

  it("should toggle unlike on click when already liked", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ liked: true, likeCount: 10 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ liked: false, likeCount: 9 }),
      });

    render(<LikeButton photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("9")).toBeInTheDocument();
    });
  });

  it("should prevent multiple clicks while loading", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ liked: false, likeCount: 10 }),
      })
      .mockReturnValueOnce(promise);

    render(<LikeButton photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    // Should only have called API twice (initial fetch + one click)
    expect(global.fetch).toHaveBeenCalledTimes(2);

    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ liked: true, likeCount: 11 }),
    });
  });

  it("should handle initial fetch error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

    render(<LikeButton photoSlug="test-photo" />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    // Should still render with default values
    expect(screen.getByText("0")).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it("should have correct accessibility labels", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: false, likeCount: 10 }),
    });

    render(<LikeButton photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByLabelText("收藏")).toBeInTheDocument();
    });
  });

  it("should change aria-label when liked", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: true, likeCount: 10 }),
    });

    render(<LikeButton photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByLabelText("取消收藏")).toBeInTheDocument();
    });
  });

  it("should handle non-ok initial response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<LikeButton photoSlug="test-photo" />);

    // Should still render with default values
    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });
});
