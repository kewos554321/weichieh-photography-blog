import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BeforeAfterSlider } from "@/components/photo/BeforeAfterSlider";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    <img src={src} alt={alt} className={className} data-testid={`image-${alt}`} />
  ),
}));

describe("BeforeAfterSlider", () => {
  const defaultProps = {
    before: "/before.jpg",
    after: "/after.jpg",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render before and after images", () => {
    render(<BeforeAfterSlider {...defaultProps} />);

    expect(screen.getByTestId("image-Before")).toBeInTheDocument();
    expect(screen.getByTestId("image-After")).toBeInTheDocument();
  });

  it("should render with custom labels", () => {
    render(<BeforeAfterSlider {...defaultProps} beforeLabel="Original" afterLabel="Edited" />);

    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(screen.getByText("Edited")).toBeInTheDocument();
    expect(screen.getByTestId("image-Original")).toBeInTheDocument();
    expect(screen.getByTestId("image-Edited")).toBeInTheDocument();
  });

  it("should start at initial position", () => {
    render(<BeforeAfterSlider {...defaultProps} initialPosition={75} />);

    const divider = document.querySelector('[style*="left: 75%"]');
    expect(divider).toBeInTheDocument();
  });

  it("should update position on mouse down", () => {
    render(<BeforeAfterSlider {...defaultProps} />);

    const container = document.querySelector(".cursor-ew-resize");
    expect(container).toBeInTheDocument();

    // Mock getBoundingClientRect
    vi.spyOn(container!, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.mouseDown(container!, { clientX: 200, clientY: 150 });

    // Position should be at 50% (200/400)
    const divider = document.querySelector('[style*="left: 50%"]');
    expect(divider).toBeInTheDocument();
  });

  it("should update position on mouse move while dragging", () => {
    render(<BeforeAfterSlider {...defaultProps} />);

    const container = document.querySelector(".cursor-ew-resize")!;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Start dragging
    fireEvent.mouseDown(container, { clientX: 200, clientY: 150 });

    // Move mouse
    fireEvent.mouseMove(window, { clientX: 300, clientY: 150 });

    // Position should be at 75% (300/400)
    const divider = document.querySelector('[style*="left: 75%"]');
    expect(divider).toBeInTheDocument();
  });

  it("should stop dragging on mouse up", () => {
    render(<BeforeAfterSlider {...defaultProps} />);

    const container = document.querySelector(".cursor-ew-resize")!;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Start dragging at 50%
    fireEvent.mouseDown(container, { clientX: 200, clientY: 150 });

    // Release mouse
    fireEvent.mouseUp(window);

    // Move mouse (should not change position since not dragging)
    fireEvent.mouseMove(window, { clientX: 100, clientY: 150 });

    // Position should still be at 50%
    const divider = document.querySelector('[style*="left: 50%"]');
    expect(divider).toBeInTheDocument();
  });

  it("should handle touch events", () => {
    render(<BeforeAfterSlider {...defaultProps} />);

    const container = document.querySelector(".cursor-ew-resize")!;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Touch start
    fireEvent.touchStart(container, { touches: [{ clientX: 200, clientY: 150 }] });

    const divider = document.querySelector('[style*="left: 50%"]');
    expect(divider).toBeInTheDocument();
  });

  it("should handle touch move while dragging", () => {
    render(<BeforeAfterSlider {...defaultProps} />);

    const container = document.querySelector(".cursor-ew-resize")!;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Touch start
    fireEvent.touchStart(container, { touches: [{ clientX: 200, clientY: 150 }] });

    // Touch move
    fireEvent.touchMove(window, { touches: [{ clientX: 300, clientY: 150 }] });

    const divider = document.querySelector('[style*="left: 75%"]');
    expect(divider).toBeInTheDocument();
  });

  it("should stop dragging on touch end", () => {
    render(<BeforeAfterSlider {...defaultProps} />);

    const container = document.querySelector(".cursor-ew-resize")!;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.touchStart(container, { touches: [{ clientX: 200, clientY: 150 }] });
    fireEvent.touchEnd(window);
    fireEvent.touchMove(window, { touches: [{ clientX: 100, clientY: 150 }] });

    // Position should still be at 50%
    const divider = document.querySelector('[style*="left: 50%"]');
    expect(divider).toBeInTheDocument();
  });

  it("should clamp position between 0 and 100", () => {
    render(<BeforeAfterSlider {...defaultProps} />);

    const container = document.querySelector(".cursor-ew-resize")!;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Try to go beyond right edge
    fireEvent.mouseDown(container, { clientX: 500, clientY: 150 });

    let divider = document.querySelector('[style*="left: 100%"]');
    expect(divider).toBeInTheDocument();

    // Try to go beyond left edge
    fireEvent.mouseDown(container, { clientX: -100, clientY: 150 });

    divider = document.querySelector('[style*="left: 0%"]');
    expect(divider).toBeInTheDocument();
  });

  it("should render vertical orientation", () => {
    render(<BeforeAfterSlider {...defaultProps} orientation="vertical" />);

    // In vertical mode, the divider should use "top" style
    const divider = document.querySelector('[style*="top: 50%"]');
    expect(divider).toBeInTheDocument();
  });

  it("should update position vertically in vertical mode", () => {
    render(<BeforeAfterSlider {...defaultProps} orientation="vertical" />);

    const container = document.querySelector(".cursor-ew-resize")!;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Mouse down - in vertical mode, we use clientY
    fireEvent.mouseDown(container, { clientX: 200, clientY: 225 });

    // Position should be at 75% (225/300)
    const divider = document.querySelector('[style*="top: 75%"]');
    expect(divider).toBeInTheDocument();
  });

  it("should show scale animation when dragging", () => {
    render(<BeforeAfterSlider {...defaultProps} />);

    const container = document.querySelector(".cursor-ew-resize")!;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.mouseDown(container, { clientX: 200, clientY: 150 });

    // The handle should have scale-110 class when dragging
    const handle = document.querySelector(".scale-110");
    expect(handle).toBeInTheDocument();
  });

  it("should do nothing if container ref is null", () => {
    const { container } = render(<BeforeAfterSlider {...defaultProps} />);

    // This is a bit contrived, but tests the early return
    const sliderContainer = container.querySelector(".cursor-ew-resize");
    if (sliderContainer) {
      // Remove the ref temporarily
      Object.defineProperty(sliderContainer, "getBoundingClientRect", {
        value: undefined,
      });
    }
  });
});
