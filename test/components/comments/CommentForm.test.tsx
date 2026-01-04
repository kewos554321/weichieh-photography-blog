import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { CommentForm } from "@/components/comments/CommentForm";

describe("CommentForm", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("should render form with inputs and submit button", () => {
    render(<CommentForm photoId={1} />);

    expect(screen.getByLabelText("名稱")).toBeInTheDocument();
    expect(screen.getByLabelText("留言內容")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /送出留言/i })).toBeInTheDocument();
  });

  it("should update name and content on input", () => {
    render(<CommentForm photoId={1} />);

    const nameInput = screen.getByLabelText("名稱");
    const contentInput = screen.getByLabelText("留言內容");

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(contentInput, { target: { value: "Test comment content" } });

    expect(nameInput).toHaveValue("Test User");
    expect(contentInput).toHaveValue("Test comment content");
  });

  it("should show character count", () => {
    render(<CommentForm photoId={1} />);

    const contentInput = screen.getByLabelText("留言內容");
    fireEvent.change(contentInput, { target: { value: "Hello" } });

    expect(screen.getByText("5/1000")).toBeInTheDocument();
  });

  it("should disable submit button when fields are empty", () => {
    render(<CommentForm photoId={1} />);

    const submitButton = screen.getByRole("button", { name: /送出留言/i });
    expect(submitButton).toBeDisabled();
  });

  it("should enable submit button when both fields have content", () => {
    render(<CommentForm photoId={1} />);

    fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "User" } });
    fireEvent.change(screen.getByLabelText("留言內容"), { target: { value: "Comment" } });

    const submitButton = screen.getByRole("button", { name: /送出留言/i });
    expect(submitButton).not.toBeDisabled();
  });

  it("should submit comment successfully", async () => {
    const onSuccess = vi.fn();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    render(<CommentForm photoId={1} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText("留言內容"), { target: { value: "Test comment" } });
    fireEvent.click(screen.getByRole("button", { name: /送出留言/i }));

    await waitFor(() => {
      expect(screen.getByText("留言已送出，待審核後即會顯示")).toBeInTheDocument();
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(screen.getByLabelText("名稱")).toHaveValue("");
    expect(screen.getByLabelText("留言內容")).toHaveValue("");
  });

  it("should submit with articleId", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    render(<CommentForm articleId={5} />);

    fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText("留言內容"), { target: { value: "Test comment" } });
    fireEvent.click(screen.getByRole("button", { name: /送出留言/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/comments", expect.objectContaining({
        body: expect.stringContaining('"articleId":5'),
      }));
    });
  });

  it("should show error message on API error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Rate limit exceeded" }),
    });

    render(<CommentForm photoId={1} />);

    fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText("留言內容"), { target: { value: "Test comment" } });
    fireEvent.click(screen.getByRole("button", { name: /送出留言/i }));

    await waitFor(() => {
      expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
    });
  });

  it("should show default error message when API returns no error message", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    render(<CommentForm photoId={1} />);

    fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText("留言內容"), { target: { value: "Test comment" } });
    fireEvent.click(screen.getByRole("button", { name: /送出留言/i }));

    await waitFor(() => {
      expect(screen.getByText("留言失敗")).toBeInTheDocument();
    });
  });

  it("should handle network errors", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

    render(<CommentForm photoId={1} />);

    fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText("留言內容"), { target: { value: "Test comment" } });
    fireEvent.click(screen.getByRole("button", { name: /送出留言/i }));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("should handle non-Error exceptions", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce("string error");

    render(<CommentForm photoId={1} />);

    fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText("留言內容"), { target: { value: "Test comment" } });
    fireEvent.click(screen.getByRole("button", { name: /送出留言/i }));

    await waitFor(() => {
      expect(screen.getByText("留言失敗，請稍後再試")).toBeInTheDocument();
    });
  });

  it("should not submit when name is only whitespace", () => {
    render(<CommentForm photoId={1} />);

    fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText("留言內容"), { target: { value: "Test" } });

    expect(screen.getByRole("button", { name: /送出留言/i })).toBeDisabled();
  });

  it("should not submit when content is only whitespace", () => {
    render(<CommentForm photoId={1} />);

    fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "User" } });
    fireEvent.change(screen.getByLabelText("留言內容"), { target: { value: "   " } });

    expect(screen.getByRole("button", { name: /送出留言/i })).toBeDisabled();
  });

  it("should clear success message after 5 seconds", async () => {
    vi.useFakeTimers();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    render(<CommentForm photoId={1} />);

    fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("留言內容"), { target: { value: "Comment" } });

    // Submit form and flush promises without advancing timers
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /送出留言/i }));
      // Flush all pending promises without advancing timers
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText("留言已送出，待審核後即會顯示")).toBeInTheDocument();

    // Advance timer by 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Message should be cleared
    expect(screen.queryByText("留言已送出，待審核後即會顯示")).not.toBeInTheDocument();
  });

  it("should show loading state during submission", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(promise);

    render(<CommentForm photoId={1} />);

    fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("留言內容"), { target: { value: "Comment" } });
    fireEvent.click(screen.getByRole("button", { name: /送出留言/i }));

    expect(screen.getByText("送出中...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();

    await act(async () => {
      resolvePromise!({ ok: true, json: () => Promise.resolve({ id: 1 }) });
    });
  });

  it("should work without onSuccess callback", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    render(<CommentForm photoId={1} />);

    fireEvent.change(screen.getByLabelText("名稱"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("留言內容"), { target: { value: "Comment" } });
    fireEvent.click(screen.getByRole("button", { name: /送出留言/i }));

    await waitFor(() => {
      expect(screen.getByText("留言已送出，待審核後即會顯示")).toBeInTheDocument();
    });
  });
});
