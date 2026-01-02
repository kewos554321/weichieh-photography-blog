import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock usePathname for different routes
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

import Header from "@/components/Header";

describe("Header", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
  });

  it("should render the logo", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Header />);
    expect(screen.getByText("WeiChieh")).toBeInTheDocument();
  });

  it("should render navigation links", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Header />);

    expect(screen.getByText("Photos")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("should have correct link hrefs", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Header />);

    expect(screen.getByRole("link", { name: "WeiChieh" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: "Photos" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute(
      "href",
      "/blog"
    );
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/contact"
    );
  });

  it("should apply active styles on home page", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Header />);

    const photosLink = screen.getByText("Photos");
    expect(photosLink.className).toContain("text-[#6b9e9a]");
  });

  it("should apply active styles on photo detail page", () => {
    mockUsePathname.mockReturnValue("/photo/test-photo");
    render(<Header />);

    const photosLink = screen.getByText("Photos");
    expect(photosLink.className).toContain("text-[#6b9e9a]");
  });

  it("should apply active styles on blog page", () => {
    mockUsePathname.mockReturnValue("/blog");
    render(<Header />);

    const blogLink = screen.getByText("Blog");
    expect(blogLink.className).toContain("text-[#6b9e9a]");
  });

  it("should apply active styles on blog detail page", () => {
    mockUsePathname.mockReturnValue("/blog/test-article");
    render(<Header />);

    const blogLink = screen.getByText("Blog");
    expect(blogLink.className).toContain("text-[#6b9e9a]");
  });

  it("should apply active styles on about page", () => {
    mockUsePathname.mockReturnValue("/about");
    render(<Header />);

    const aboutLink = screen.getByText("About");
    expect(aboutLink.className).toContain("text-[#6b9e9a]");
  });

  it("should apply active styles on contact page", () => {
    mockUsePathname.mockReturnValue("/contact");
    render(<Header />);

    const contactLink = screen.getByText("Contact");
    expect(contactLink.className).toContain("text-[#6b9e9a]");
  });

  it("should not apply active styles to photos when on blog", () => {
    mockUsePathname.mockReturnValue("/blog");
    render(<Header />);

    const photosLink = screen.getByText("Photos");
    // Check that it has hover class but not the standalone active class
    expect(photosLink.className).toContain("hover:text-[#6b9e9a]");
    // The active class would be at the start or after a space, not prefixed with "hover:"
    expect(photosLink.className).not.toMatch(/(?:^|\s)text-\[#6b9e9a\](?:\s|$)/);
  });
});
