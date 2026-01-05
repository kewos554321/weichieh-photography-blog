"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Maximize2 } from "lucide-react";
import { EnhancedLightbox } from "@/components/lightbox/EnhancedLightbox";
import { PhotoWallSkeleton, Skeleton } from "@/components/skeletons/Skeleton";
import { BlurImage } from "@/components/BlurImage";

interface Photo {
  id: number;
  slug: string;
  src: string;
  title: string;
  category: string;
}

const categories = ["All", "Portrait", "Landscape", "Street", "Nature"];

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/photos")
      .then((res) => res.json())
      .then((data) => {
        setPhotos(data.photos || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredPhotos = filter === "All"
    ? photos
    : photos.filter(p => p.category === filter);

  const featuredPhoto = photos[0];

  if (loading) {
    return (
      <div className="pt-14 md:pt-16 min-h-screen page-transition">
        {/* Hero Skeleton */}
        <section className="relative h-[50vh] md:h-[70vh] overflow-hidden">
          <Skeleton className="w-full h-full" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
            <div className="max-w-7xl mx-auto space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-2/3 md:w-1/2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </section>
        {/* Divider */}
        <div className="flex items-center justify-center py-8 md:py-12">
          <div className="h-px w-16 bg-[var(--card-border)]" />
          <div className="mx-4 w-2 h-2 rounded-full bg-[var(--accent-teal)]/50" />
          <div className="h-px w-16 bg-[var(--card-border)]" />
        </div>
        {/* Filter Skeleton */}
        <section className="px-4 md:px-6 pb-8 md:pb-12">
          <div className="max-w-7xl mx-auto flex flex-col items-center">
            <Skeleton className="h-8 w-24 mb-6 md:mb-8" />
            <div className="flex gap-2 md:gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </section>
        {/* Photo Wall Skeleton */}
        <section className="max-w-7xl mx-auto px-2 md:px-4 pb-16 md:pb-24">
          <PhotoWallSkeleton />
        </section>
      </div>
    );
  }

  return (
    <div className="pt-14 md:pt-16">
      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[70vh] overflow-hidden bg-[var(--card-border)]">
        {featuredPhoto ? (
          <>
            <Image
              src={featuredPhoto.src}
              alt="Featured"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--card-bg)] to-[var(--card-border)]" />
        )}

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent-teal)] mb-3 md:mb-4">
              一張圖片，一個故事
            </p>
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-[var(--foreground)] mb-4 md:mb-6 max-w-2xl leading-tight">
              用光影捕捉<br className="hidden md:block" />生命中的瞬間
            </h1>
            {featuredPhoto && (
              <Link
                href={`/photo/${featuredPhoto.slug}`}
                className="inline-flex items-center gap-2 text-sm tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent-teal)] transition-colors duration-500 group"
              >
                <span>探索作品集</span>
                <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Decorative Divider */}
      <div className="flex items-center justify-center py-8 md:py-12">
        <div className="h-px w-16 bg-[var(--card-border)]" />
        <div className="mx-4 w-2 h-2 rounded-full bg-[var(--accent-teal)]/50" />
        <div className="h-px w-16 bg-[var(--card-border)]" />
      </div>

      {/* Filter Section */}
      <section className="px-4 md:px-6 pb-8 md:pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center">
            <h2 className="font-serif text-2xl md:text-3xl text-[var(--text-primary)] mb-6 md:mb-8">Photos</h2>
            <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 md:px-6 py-2 md:py-2.5 text-xs tracking-[0.2em] uppercase transition-all duration-500 rounded-full border ${
                    filter === cat
                      ? "bg-[var(--accent-teal)] text-white border-[var(--accent-teal)]"
                      : "bg-transparent text-[var(--text-secondary)] border-[var(--card-border)] hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Photo Wall */}
      <section className="max-w-7xl mx-auto px-2 md:px-4 pb-16 md:pb-24">
        {filteredPhotos.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
            {filteredPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="mb-3 md:mb-4 break-inside-avoid group relative"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link href={`/photo/${photo.slug}`} className="block">
                  <div className="relative overflow-hidden rounded-sm">
                    <BlurImage
                      src={photo.src}
                      alt={photo.title}
                      width={600}
                      height={800}
                      className="w-full h-auto group-hover:scale-[1.03]"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

                    {/* Photo Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--accent-amber)] mb-1">{photo.category}</p>
                      <h3 className="font-serif text-sm md:text-base text-white">{photo.title}</h3>
                    </div>
                  </div>
                </Link>

                {/* Lightbox Button */}
                <button
                  onClick={() => setLightboxIndex(index)}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white/70 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                  aria-label="Open in lightbox"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[var(--text-muted)]">尚無照片</p>
          </div>
        )}
      </section>

      {/* Bottom CTA Section */}
      <section className="border-t border-[var(--card-border)] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent-teal)] mb-4">Stories Behind The Lens</p>
          <h2 className="font-serif text-2xl md:text-4xl text-[var(--text-primary)] mb-6">探索更多攝影故事</h2>
          <Link
            href="/blog"
            className="inline-flex items-center gap-3 px-8 py-3 border border-[var(--text-muted)] text-sm tracking-wider text-[var(--text-secondary)] hover:bg-[var(--foreground)] hover:text-[var(--background)] hover:border-[var(--foreground)] transition-all duration-500 rounded-full"
          >
            <span>閱讀 Blog</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <EnhancedLightbox
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
