"use client";

import { useState } from "react";
import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { EnhancedLightbox } from "@/components/lightbox/EnhancedLightbox";
import { BlurImage } from "@/components/BlurImage";

interface Photo {
  id: number;
  slug: string;
  src: string;
  title: string;
  category: string;
}

interface PhotoWallProps {
  photos: Photo[];
  categories: string[];
}

export function PhotoWall({ photos, categories }: PhotoWallProps) {
  const [filter, setFilter] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredPhotos = filter === "All"
    ? photos
    : photos.filter(p => p.category === filter);

  return (
    <>
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

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <EnhancedLightbox
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
