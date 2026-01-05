"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface BlurImageProps extends Omit<ImageProps, "onLoad"> {
  wrapperClassName?: string;
}

// Simple shimmer placeholder SVG
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#e5e5e5" offset="20%" />
      <stop stop-color="#f0f0f0" offset="50%" />
      <stop stop-color="#e5e5e5" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#e5e5e5" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

export function BlurImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  fill,
  width,
  height,
  ...props
}: BlurImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Calculate dimensions for shimmer
  const shimmerWidth = typeof width === "number" ? width : 700;
  const shimmerHeight = typeof height === "number" ? height : 475;

  return (
    <div className={`overflow-hidden ${wrapperClassName}`}>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={`transition-all duration-500 ${
          isLoading ? "scale-105 blur-sm" : "scale-100 blur-0"
        } ${className}`}
        placeholder="blur"
        blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(shimmerWidth, shimmerHeight))}`}
        onLoad={() => setIsLoading(false)}
        {...props}
      />
    </div>
  );
}
