"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const photos = [
  { id: 1, slug: "silent-gaze", src: "https://picsum.photos/seed/pw1/600/900", category: "Portrait" },
  { id: 2, slug: "mountain-dawn", src: "https://picsum.photos/seed/pw2/600/400", category: "Landscape" },
  { id: 3, slug: "urban-rhythm", src: "https://picsum.photos/seed/pw3/600/600", category: "Street" },
  { id: 4, slug: "the-artist", src: "https://picsum.photos/seed/pw4/600/450", category: "Portrait" },
  { id: 5, slug: "forest-whisper", src: "https://picsum.photos/seed/pw5/600/800", category: "Nature" },
  { id: 6, slug: "night-market", src: "https://picsum.photos/seed/pw6/600/500", category: "Street" },
  { id: 7, slug: "ocean-blue", src: "https://picsum.photos/seed/pw7/600/700", category: "Landscape" },
  { id: 8, slug: "childhood", src: "https://picsum.photos/seed/pw8/600/400", category: "Portrait" },
  { id: 9, slug: "misty-morning", src: "https://picsum.photos/seed/pw9/600/850", category: "Nature" },
  { id: 10, slug: "temple-fair", src: "https://picsum.photos/seed/pw10/600/550", category: "Street" },
  { id: 11, slug: "golden-fields", src: "https://picsum.photos/seed/pw11/600/400", category: "Landscape" },
  { id: 12, slug: "reflection", src: "https://picsum.photos/seed/pw12/600/750", category: "Portrait" },
  { id: 13, slug: "waterfall", src: "https://picsum.photos/seed/pw13/600/500", category: "Nature" },
  { id: 14, slug: "old-town", src: "https://picsum.photos/seed/pw14/600/650", category: "Street" },
  { id: 15, slug: "sunset", src: "https://picsum.photos/seed/pw15/600/400", category: "Landscape" },
  { id: 16, slug: "wisdom", src: "https://picsum.photos/seed/pw16/600/800", category: "Portrait" },
];

const categories = ["All", "Portrait", "Landscape", "Street", "Nature"];

export default function Home() {
  const [filter, setFilter] = useState("All");

  const filteredPhotos = filter === "All"
    ? photos
    : photos.filter(p => p.category === filter);

  return (
    <div className="pt-16 md:pt-20">
      {/* Decorative line - subtle accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#5a8a87]/30 to-transparent" />

      {/* Filter */}
      <section className="py-6 md:py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 md:gap-6 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 md:px-4 py-2 text-xs md:text-sm tracking-widest uppercase transition-all duration-500 ${
                  filter === cat
                    ? "text-[#5a8a87] border-b border-[#5a8a87]"
                    : "text-stone-400 hover:text-[#5a8a87]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Wall */}
      <section className="max-w-7xl mx-auto px-2 md:px-4 pb-12">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-3">
          {filteredPhotos.map((photo) => (
            <Link
              key={photo.id}
              href={`/photo/${photo.slug}`}
              className="mb-2 md:mb-3 break-inside-avoid group block"
            >
              <div className="relative overflow-hidden">
                <Image
                  src={photo.src}
                  alt={photo.slug.replace(/-/g, " ")}
                  width={600}
                  height={800}
                  className="w-full h-auto transition-all duration-700 group-hover:scale-[1.02] cinematic-image"
                />
                {/* Cinematic film overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2a2a2a]/20 via-transparent to-[#c9a77c]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
