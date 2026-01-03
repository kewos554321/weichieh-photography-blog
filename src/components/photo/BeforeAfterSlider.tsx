"use client";

import Image from "next/image";
import { useState, useRef, useCallback, useEffect } from "react";

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  orientation?: "horizontal" | "vertical";
  initialPosition?: number; // 0-100
}

export function BeforeAfterSlider({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  orientation = "horizontal",
  initialPosition = 50,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHorizontal = orientation === "horizontal";

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let newPosition: number;

      if (isHorizontal) {
        newPosition = ((clientX - rect.left) / rect.width) * 100;
      } else {
        newPosition = ((clientY - rect.top) / rect.height) * 100;
      }

      // Clamp between 0 and 100
      newPosition = Math.max(0, Math.min(100, newPosition));
      setPosition(newPosition);
    },
    [isHorizontal]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updatePosition(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    updatePosition(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updatePosition(e.clientX, e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0];
        updatePosition(touch.clientX, touch.clientY);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, updatePosition]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-lg select-none cursor-ew-resize"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* After Image (Background) */}
      <div className="absolute inset-0">
        <Image
          src={after}
          alt={afterLabel}
          fill
          className="object-cover"
          draggable={false}
        />
      </div>

      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={
          isHorizontal
            ? { clipPath: `inset(0 ${100 - position}% 0 0)` }
            : { clipPath: `inset(0 0 ${100 - position}% 0)` }
        }
      >
        <Image
          src={before}
          alt={beforeLabel}
          fill
          className="object-cover"
          draggable={false}
        />
      </div>

      {/* Divider Line */}
      <div
        className={`absolute bg-white shadow-lg ${
          isHorizontal
            ? "top-0 bottom-0 w-0.5 -translate-x-1/2"
            : "left-0 right-0 h-0.5 -translate-y-1/2"
        }`}
        style={
          isHorizontal
            ? { left: `${position}%` }
            : { top: `${position}%` }
        }
      >
        {/* Handle */}
        <div
          className={`absolute bg-white rounded-full shadow-lg flex items-center justify-center ${
            isHorizontal
              ? "w-10 h-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              : "w-10 h-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          } ${isDragging ? "scale-110" : ""} transition-transform`}
        >
          {isHorizontal ? (
            <svg
              className="w-5 h-5 text-stone-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l4-4 4 4M8 15l4 4 4-4"
                transform="rotate(90 12 12)"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-stone-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l4-4 4 4M8 15l4 4 4-4"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Labels */}
      <div
        className={`absolute px-3 py-1 bg-black/50 text-white text-xs rounded ${
          isHorizontal ? "top-3 left-3" : "top-3 left-3"
        }`}
      >
        {beforeLabel}
      </div>
      <div
        className={`absolute px-3 py-1 bg-black/50 text-white text-xs rounded ${
          isHorizontal ? "top-3 right-3" : "bottom-3 right-3"
        }`}
      >
        {afterLabel}
      </div>
    </div>
  );
}
