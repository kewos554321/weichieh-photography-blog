import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "@/components/Footer";

describe("Footer", () => {
  it("should render copyright text", () => {
    render(<Footer />);
    expect(screen.getByText("© 2024 WeiChieh Photography")).toBeInTheDocument();
  });

  it("should render Instagram link", () => {
    render(<Footer />);
    expect(screen.getByText("Instagram")).toBeInTheDocument();
  });

  it("should render Email link", () => {
    render(<Footer />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("should have placeholder links for social media", () => {
    render(<Footer />);
    const instagramLink = screen.getByRole("link", { name: "Instagram" });
    const emailLink = screen.getByRole("link", { name: "Email" });

    expect(instagramLink).toHaveAttribute("href", "#");
    expect(emailLink).toHaveAttribute("href", "#");
  });
});
