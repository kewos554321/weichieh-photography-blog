"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const photos = [
  { id: 1, slug: "silent-gaze", src: "https://picsum.photos/seed/pw1/600/900", category: "Portrait", title: "Silent Gaze" },
  { id: 2, slug: "mountain-dawn", src: "https://picsum.photos/seed/pw2/600/400", category: "Landscape", title: "Mountain Dawn" },
  { id: 3, slug: "urban-rhythm", src: "https://picsum.photos/seed/pw3/600/600", category: "Street", title: "Urban Rhythm" },
  { id: 4, slug: "the-artist", src: "https://picsum.photos/seed/pw4/600/450", category: "Portrait", title: "The Artist" },
  { id: 5, slug: "forest-whisper", src: "https://picsum.photos/seed/pw5/600/800", category: "Nature", title: "Forest Whisper" },
  { id: 6, slug: "night-market", src: "https://picsum.photos/seed/pw6/600/500", category: "Street", title: "Night Market" },
  { id: 7, slug: "ocean-blue", src: "https://picsum.photos/seed/pw7/600/700", category: "Landscape", title: "Ocean Blue" },
  { id: 8, slug: "childhood", src: "https://picsum.photos/seed/pw8/600/400", category: "Portrait", title: "Childhood" },
  { id: 9, slug: "misty-morning", src: "https://picsum.photos/seed/pw9/600/850", category: "Nature", title: "Misty Morning" },
  { id: 10, slug: "temple-fair", src: "https://picsum.photos/seed/pw10/600/550", category: "Street", title: "Temple Fair" },
  { id: 11, slug: "golden-fields", src: "https://picsum.photos/seed/pw11/600/400", category: "Landscape", title: "Golden Fields" },
  { id: 12, slug: "reflection", src: "https://picsum.photos/seed/pw12/600/750", category: "Portrait", title: "Reflection" },
  { id: 13, slug: "waterfall", src: "https://picsum.photos/seed/pw13/600/500", category: "Nature", title: "Waterfall" },
  { id: 14, slug: "old-town", src: "https://picsum.photos/seed/pw14/600/650", category: "Street", title: "Old Town" },
  { id: 15, slug: "sunset", src: "https://picsum.photos/seed/pw15/600/400", category: "Landscape", title: "Sunset" },
  { id: 16, slug: "wisdom", src: "https://picsum.photos/seed/pw16/600/800", category: "Portrait", title: "Wisdom" },
];

const categories = ["All", "Portrait", "Landscape", "Street", "Nature"];

export default function Home() {
  const [filter, setFilter] = useState("All");

  const filteredPhotos = filter === "All"
    ? photos
    : photos.filter(p => p.category === filter);

  const featuredPhoto = photos[0];

  return (
    <div className="pt-16 md:pt-20">
      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[70vh] overflow-hidden">
        <Image
          src="https://picsum.photos/seed/hero/1920/1080"
          alt="Featured"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fafaf8] via-[#fafaf8]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fafaf8]/60 to-transparent" />

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs tracking-[0.3em] uppercase text-[#6b9e9a] mb-3 md:mb-4">
              一張圖片，一個故事
            </p>
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-stone-800 mb-4 md:mb-6 max-w-2xl leading-tight">
              用光影捕捉<br className="hidden md:block" />生命中的瞬間
            </h1>
            <Link
              href={`/photo/${featuredPhoto.slug}`}
              className="inline-flex items-center gap-2 text-sm tracking-wider text-stone-600 hover:text-[#6b9e9a] transition-colors duration-500 group"
            >
              <span>探索作品集</span>
              <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Decorative Divider */}
      <div className="flex items-center justify-center py-8 md:py-12">
        <div className="h-px w-16 bg-stone-300" />
        <div className="mx-4 w-2 h-2 rounded-full bg-[#6b9e9a]/50" />
        <div className="h-px w-16 bg-stone-300" />
      </div>

      {/* Filter Section */}
      <section className="px-4 md:px-6 pb-8 md:pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center">
            <h2 className="font-serif text-2xl md:text-3xl text-stone-700 mb-6 md:mb-8">Gallery</h2>
            <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 md:px-6 py-2 md:py-2.5 text-xs tracking-[0.2em] uppercase transition-all duration-500 rounded-full border ${
                    filter === cat
                      ? "bg-[#6b9e9a] text-white border-[#6b9e9a]"
                      : "bg-transparent text-stone-500 border-stone-300 hover:border-[#6b9e9a] hover:text-[#6b9e9a]"
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
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
          {filteredPhotos.map((photo, index) => (
            <Link
              key={photo.id}
              href={`/photo/${photo.slug}`}
              className="mb-3 md:mb-4 break-inside-avoid group block"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative overflow-hidden rounded-sm">
                <Image
                  src={photo.src}
                  alt={photo.title}
                  width={600}
                  height={800}
                  className="w-full h-auto transition-all duration-700 group-hover:scale-[1.03]"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

                {/* Photo Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#d4a574] mb-1">{photo.category}</p>
                  <h3 className="font-serif text-sm md:text-base text-white">{photo.title}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="border-t border-stone-200 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#6b9e9a] mb-4">Stories Behind The Lens</p>
          <h2 className="font-serif text-2xl md:text-4xl text-stone-700 mb-6">探索更多攝影故事</h2>
          <Link
            href="/blog"
            className="inline-flex items-center gap-3 px-8 py-3 border border-stone-400 text-sm tracking-wider text-stone-600 hover:bg-stone-800 hover:text-white hover:border-stone-800 transition-all duration-500 rounded-full"
          >
            <span>閱讀 Blog</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
