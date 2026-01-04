import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EnhancedLightbox } from "@/components/lightbox/EnhancedLightbox";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, onLoad, onClick, className }: { src: string; alt: string; onLoad?: () => void; onClick?: (e: React.MouseEvent) => void; className?: string }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onClick={onClick}
      data-testid="lightbox-image"
    />
  ),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("EnhancedLightbox", () => {
  const mockPhotos = [
    { id: 1, slug: "photo-1", src: "/photos/1.jpg", title: "Photo 1" },
    { id: 2, slug: "photo-2", src: "/photos/2.jpg", title: "Photo 2" },
    { id: 3, slug: "photo-3", src: "/photos/3.jpg", title: "Photo 3" },
  ];

  const defaultProps = {
    photos: mockPhotos,
    currentIndex: 1,
    onClose: vi.fn(),
    onNavigate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Image constructor for preloading
    global.Image = class {
      src = "";
    } as unknown as typeof Image;
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("should render current photo", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    expect(screen.getByAltText("Photo 2")).toBeInTheDocument();
    expect(screen.getByText("Photo 2")).toBeInTheDocument();
  });

  it("should show photo counter", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    const closeButton = screen.getByLabelText("Close lightbox");
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should call onClose when clicking overlay", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    // Click on the main container area (which has cursor-zoom-out)
    const container = document.querySelector(".cursor-zoom-out");
    if (container) {
      fireEvent.click(container);
    }

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should not close when clicking on the image itself", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    const image = screen.getByTestId("lightbox-image");
    fireEvent.click(image);

    // onClose should not be called because we stopPropagation
    expect(defaultProps.onClose).toHaveBeenCalledTimes(0);
  });

  it("should show navigation buttons when not at edges", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    expect(screen.getByLabelText("Previous photo")).toBeInTheDocument();
    expect(screen.getByLabelText("Next photo")).toBeInTheDocument();
  });

  it("should hide previous button at first photo", () => {
    render(<EnhancedLightbox {...defaultProps} currentIndex={0} />);

    expect(screen.queryByLabelText("Previous photo")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Next photo")).toBeInTheDocument();
  });

  it("should hide next button at last photo", () => {
    render(<EnhancedLightbox {...defaultProps} currentIndex={2} />);

    expect(screen.getByLabelText("Previous photo")).toBeInTheDocument();
    expect(screen.queryByLabelText("Next photo")).not.toBeInTheDocument();
  });

  it("should navigate to previous photo when clicking prev button", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    const prevButton = screen.getByLabelText("Previous photo");
    fireEvent.click(prevButton);

    expect(defaultProps.onNavigate).toHaveBeenCalledWith(0);
  });

  it("should navigate to next photo when clicking next button", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    const nextButton = screen.getByLabelText("Next photo");
    fireEvent.click(nextButton);

    expect(defaultProps.onNavigate).toHaveBeenCalledWith(2);
  });

  it("should navigate with keyboard arrow keys", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(defaultProps.onNavigate).toHaveBeenCalledWith(0);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(defaultProps.onNavigate).toHaveBeenCalledWith(2);
  });

  it("should close with Escape key", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should not navigate left when at first photo", () => {
    render(<EnhancedLightbox {...defaultProps} currentIndex={0} />);

    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(defaultProps.onNavigate).not.toHaveBeenCalled();
  });

  it("should not navigate right when at last photo", () => {
    render(<EnhancedLightbox {...defaultProps} currentIndex={2} />);

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(defaultProps.onNavigate).not.toHaveBeenCalled();
  });

  it("should prevent body scroll when mounted", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should restore body scroll when unmounted", () => {
    const { unmount } = render(<EnhancedLightbox {...defaultProps} />);

    unmount();

    expect(document.body.style.overflow).toBe("");
  });

  it("should handle touch swipe left to go next", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    const container = document.querySelector(".fixed.inset-0");
    if (container) {
      fireEvent.touchStart(container, { touches: [{ clientX: 300 }] });
      fireEvent.touchMove(container, { touches: [{ clientX: 100 }] });
      fireEvent.touchEnd(container);
    }

    expect(defaultProps.onNavigate).toHaveBeenCalledWith(2);
  });

  it("should handle touch swipe right to go prev", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    const container = document.querySelector(".fixed.inset-0");
    if (container) {
      fireEvent.touchStart(container, { touches: [{ clientX: 100 }] });
      fireEvent.touchMove(container, { touches: [{ clientX: 300 }] });
      fireEvent.touchEnd(container);
    }

    expect(defaultProps.onNavigate).toHaveBeenCalledWith(0);
  });

  it("should not navigate on small swipe distance", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    const container = document.querySelector(".fixed.inset-0");
    if (container) {
      fireEvent.touchStart(container, { touches: [{ clientX: 100 }] });
      fireEvent.touchMove(container, { touches: [{ clientX: 120 }] });
      fireEvent.touchEnd(container);
    }

    expect(defaultProps.onNavigate).not.toHaveBeenCalled();
  });

  it("should not navigate when touch start or end is missing", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    const container = document.querySelector(".fixed.inset-0");
    if (container) {
      // Only touch end without start/move
      fireEvent.touchEnd(container);
    }

    expect(defaultProps.onNavigate).not.toHaveBeenCalled();
  });

  it("should show link to photo detail page", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    const link = screen.getByRole("link", { name: /查看詳情/i });
    expect(link).toHaveAttribute("href", "/photo/photo-2");
  });

  it("should show keyboard hints", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    expect(screen.getByText("Navigate")).toBeInTheDocument();
    expect(screen.getByText("Close")).toBeInTheDocument();
  });

  it("should show loading indicator before image loads", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    // The loading spinner should be present
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should hide loading indicator after image loads", () => {
    render(<EnhancedLightbox {...defaultProps} />);

    const image = screen.getByTestId("lightbox-image");
    fireEvent.load(image);

    // After load, the image should have opacity-100
    expect(image.className).toContain("opacity-100");
  });
});
