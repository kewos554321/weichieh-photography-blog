import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MarkdownContent from "@/components/MarkdownContent";

describe("MarkdownContent", () => {
  describe("Basic rendering", () => {
    it("should render plain text", () => {
      render(<MarkdownContent content="Hello World" />);
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("should render with custom className", () => {
      const { container } = render(
        <MarkdownContent content="Test" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("should render empty content", () => {
      const { container } = render(<MarkdownContent content="" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Headings", () => {
    it("should render h2 heading", () => {
      render(<MarkdownContent content="## Section Title" />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Section Title");
      expect(heading).toHaveAttribute("id", "section-title");
    });

    it("should render h3 heading", () => {
      render(<MarkdownContent content="### Subsection" />);
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Subsection");
    });

    it("should generate proper id for Chinese headings", () => {
      render(<MarkdownContent content="## 中文標題" />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveAttribute("id", "中文標題");
    });
  });

  describe("Text formatting", () => {
    it("should render bold text", () => {
      render(<MarkdownContent content="This is **bold** text" />);
      const bold = screen.getByText("bold");
      expect(bold.tagName).toBe("STRONG");
    });

    it("should render italic text", () => {
      render(<MarkdownContent content="This is *italic* text" />);
      const italic = screen.getByText("italic");
      expect(italic.tagName).toBe("EM");
    });
  });

  describe("Links", () => {
    it("should render internal links", () => {
      render(<MarkdownContent content="Click [here](/about) for more" />);
      const link = screen.getByRole("link", { name: "here" });
      expect(link).toHaveAttribute("href", "/about");
      expect(link).not.toHaveAttribute("target");
    });

    it("should render external links with target blank", () => {
      render(<MarkdownContent content="Visit [Google](https://google.com)" />);
      const link = screen.getByRole("link", { name: "Google" });
      expect(link).toHaveAttribute("href", "https://google.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Images", () => {
    it("should render image with alt text", () => {
      render(<MarkdownContent content="![Beautiful sunset](/sunset.jpg)" />);
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", "/sunset.jpg");
      expect(img).toHaveAttribute("alt", "Beautiful sunset");
    });

    it("should render image caption when alt text is provided", () => {
      render(<MarkdownContent content="![Photo caption](/photo.jpg)" />);
      expect(screen.getByText("Photo caption")).toBeInTheDocument();
    });

    it("should render image without caption when no alt text", () => {
      const { container } = render(<MarkdownContent content="![](/photo.jpg)" />);
      const img = container.querySelector("img");
      expect(img).toHaveAttribute("alt", "");
      expect(img).toHaveAttribute("src", "/photo.jpg");
    });

    it("should render inline image with surrounding text", () => {
      const { container } = render(
        <MarkdownContent content="See this ![photo](/test.jpg) for example" />
      );
      const img = container.querySelector("img");
      expect(img).toHaveAttribute("src", "/test.jpg");
      expect(img).toHaveAttribute("alt", "photo");
      expect(container.textContent).toContain("See this");
      expect(container.textContent).toContain("for example");
    });

    it("should render inline image with alt text as caption", () => {
      const { container } = render(
        <MarkdownContent content="Here is ![My Caption](/inline.jpg) in text" />
      );
      // Caption should appear for inline images with alt text
      expect(screen.getByText("My Caption")).toBeInTheDocument();
    });

    it("should render inline image without alt text", () => {
      const { container } = render(
        <MarkdownContent content="Here is ![](/inline.jpg) an image" />
      );
      const img = container.querySelector("img");
      expect(img).toHaveAttribute("src", "/inline.jpg");
      expect(img).toHaveAttribute("alt", "");
    });
  });

  describe("Blockquotes", () => {
    it("should render blockquote", () => {
      render(<MarkdownContent content="> This is a quote" />);
      const blockquote = screen.getByText("This is a quote").closest("blockquote");
      expect(blockquote).toBeInTheDocument();
    });
  });

  describe("Lists", () => {
    it("should render unordered list with asterisks", () => {
      render(<MarkdownContent content="* Item 1" />);
      const list = screen.getByRole("list");
      expect(list.tagName).toBe("UL");
    });

    it("should render unordered list with dashes", () => {
      render(<MarkdownContent content="- First" />);
      const list = screen.getByRole("list");
      expect(list.tagName).toBe("UL");
    });

    it("should render ordered list", () => {
      render(<MarkdownContent content="1. First" />);
      const list = screen.getByRole("list");
      expect(list.tagName).toBe("OL");
    });
  });

  describe("Multiple blocks", () => {
    it("should render content with double newlines", () => {
      const content = "First paragraph\n\nSecond paragraph";
      const { container } = render(<MarkdownContent content={content} />);
      expect(container.textContent).toContain("First paragraph");
      expect(container.textContent).toContain("Second paragraph");
    });

    it("should render mixed content", () => {
      const content = `## Title

This is a paragraph with **bold** text.

> A wise quote`;

      render(<MarkdownContent content={content} />);

      expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
      expect(screen.getByText("bold")).toBeInTheDocument();
      expect(screen.getByText("A wise quote")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle content with only whitespace", () => {
      const { container } = render(<MarkdownContent content="   \n\n   " />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle special characters in text", () => {
      render(<MarkdownContent content="Hello! What's up?" />);
      expect(screen.getByText("Hello! What's up?")).toBeInTheDocument();
    });

    it("should handle bold in lists", () => {
      render(<MarkdownContent content="* **Bold** item" />);
      expect(screen.getByText("Bold")).toBeInTheDocument();
    });

    it("should handle inline markdown in blockquotes", () => {
      render(<MarkdownContent content="> Quote with **bold**" />);
      expect(screen.getByText("bold")).toBeInTheDocument();
    });
  });
});
