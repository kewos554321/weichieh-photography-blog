import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CommentList } from "@/components/comments/CommentList";

describe("CommentList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should show loading state initially", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(new Promise(() => {}));

    render(<CommentList photoSlug="test-photo" />);

    // Loading spinner should be visible (we can check for the animate-spin class)
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should fetch and display comments for photo", async () => {
    const mockComments = [
      { id: 1, name: "User 1", content: "Comment 1", createdAt: "2024-01-15T12:00:00Z" },
      { id: 2, name: "User 2", content: "Comment 2", createdAt: "2024-01-14T12:00:00Z" },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ comments: mockComments }),
    });

    render(<CommentList photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByText("User 1")).toBeInTheDocument();
      expect(screen.getByText("Comment 1")).toBeInTheDocument();
      expect(screen.getByText("User 2")).toBeInTheDocument();
      expect(screen.getByText("Comment 2")).toBeInTheDocument();
    });

    expect(screen.getByText("留言 (2)")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith("/api/photos/test-photo/comments");
  });

  it("should fetch comments for article", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ comments: [] }),
    });

    render(<CommentList articleSlug="test-article" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/articles/test-article/comments");
    });
  });

  it("should show empty state when no comments", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ comments: [] }),
    });

    render(<CommentList photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByText("還沒有留言，成為第一個留言的人吧！")).toBeInTheDocument();
    });
  });

  it("should format dates in Chinese locale", async () => {
    const mockComments = [
      { id: 1, name: "User", content: "Comment", createdAt: "2024-03-15T12:00:00Z" },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ comments: mockComments }),
    });

    render(<CommentList photoSlug="test-photo" />);

    await waitFor(() => {
      // The date should be formatted in Chinese locale
      expect(screen.getByText(/2024年/)).toBeInTheDocument();
    });
  });

  it("should handle fetch errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

    render(<CommentList photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByText("還沒有留言，成為第一個留言的人吧！")).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch comments:", expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("should handle non-ok response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<CommentList photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByText("還沒有留言，成為第一個留言的人吧！")).toBeInTheDocument();
    });
  });

  it("should not fetch when neither photoSlug nor articleSlug is provided", async () => {
    render(<CommentList />);

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it("should refetch when refreshKey changes", async () => {
    const mockComments1 = [{ id: 1, name: "User 1", content: "Comment 1", createdAt: "2024-01-15T12:00:00Z" }];
    const mockComments2 = [
      { id: 1, name: "User 1", content: "Comment 1", createdAt: "2024-01-15T12:00:00Z" },
      { id: 2, name: "User 2", content: "Comment 2", createdAt: "2024-01-16T12:00:00Z" },
    ];

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ comments: mockComments1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ comments: mockComments2 }),
      });

    const { rerender } = render(<CommentList photoSlug="test-photo" refreshKey={0} />);

    await waitFor(() => {
      expect(screen.getByText("留言 (1)")).toBeInTheDocument();
    });

    rerender(<CommentList photoSlug="test-photo" refreshKey={1} />);

    await waitFor(() => {
      expect(screen.getByText("留言 (2)")).toBeInTheDocument();
    });
  });

  it("should handle missing comments array in response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<CommentList photoSlug="test-photo" />);

    await waitFor(() => {
      expect(screen.getByText("還沒有留言，成為第一個留言的人吧！")).toBeInTheDocument();
    });
  });
});
