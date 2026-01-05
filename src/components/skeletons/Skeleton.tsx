"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton rounded-sm bg-[var(--card-border)]",
        className
      )}
    />
  );
}

export function PhotoSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="w-full aspect-[3/4] rounded-sm" />
    </div>
  );
}

export function PhotoCardSkeleton() {
  return (
    <div className="mb-3 md:mb-4 break-inside-avoid">
      <Skeleton className="w-full aspect-[3/4] rounded-sm" />
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8 p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg">
      <Skeleton className="w-full md:w-64 h-48 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-32 mt-4" />
      </div>
    </div>
  );
}

export function AlbumCardSkeleton() {
  return (
    <div className="group">
      <Skeleton className="w-full aspect-[4/3] rounded-lg mb-3" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function PhotoDetailSkeleton() {
  return (
    <div className="pt-16 md:pt-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <Skeleton className="w-full aspect-[16/10] rounded-lg mb-8" />
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="pt-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhotoWallSkeleton() {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <PhotoCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BlogListSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AlbumGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <AlbumCardSkeleton key={i} />
      ))}
    </div>
  );
}
