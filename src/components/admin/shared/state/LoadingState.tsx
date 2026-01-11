"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullHeight?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function LoadingState({
  message = "Loading...",
  size = "md",
  fullHeight = false,
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-stone-500 ${
        fullHeight ? "min-h-[400px]" : "p-8"
      } ${className}`}
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}
