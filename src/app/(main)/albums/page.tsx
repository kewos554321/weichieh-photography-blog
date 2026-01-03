"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { FolderOpen, Images } from "lucide-react";

interface Album {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  photoCount: number;
  previewPhotos: { id: number; slug: string; src: string; title: string }[];
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/albums")
      .then((res) => res.json())
      .then((data) => {
        setAlbums(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="pt-16 md:pt-20 min-h-screen flex items-center justify-center">
        <div className="text-stone-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="pt-16 md:pt-20 min-h-screen">
      {/* Header */}
      <section className="py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#6b9e9a] mb-3">
            Collections
          </p>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-stone-800 mb-4">
            相簿
          </h1>
          <p className="text-stone-500 font-light max-w-xl mx-auto">
            精選的攝影作品集，按主題分類整理
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="flex items-center justify-center gap-4 px-4">
        <div className="h-px w-16 bg-stone-200" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#6b9e9a]" />
        <div className="h-px w-16 bg-stone-200" />
      </div>

      {/* Albums Grid */}
      <section className="py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {albums.length === 0 ? (
            <div className="text-center py-20">
              <FolderOpen className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-400">尚無相簿</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {albums.map((album) => (
                <Link
                  key={album.id}
                  href={`/albums/${album.slug}`}
                  className="group block"
                >
                  {/* Album Cover */}
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-stone-100 mb-4">
                    {album.coverUrl ? (
                      <Image
                        src={album.coverUrl}
                        alt={album.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : album.previewPhotos[0] ? (
                      <Image
                        src={album.previewPhotos[0].src}
                        alt={album.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Images className="w-12 h-12 text-stone-300" />
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-colors duration-500" />
                    {/* Photo Count Badge */}
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs text-stone-700 flex items-center gap-1">
                      <Images className="w-3 h-3" />
                      {album.photoCount}
                    </div>
                  </div>

                  {/* Album Info */}
                  <h2 className="font-serif text-xl text-stone-800 group-hover:text-[#6b9e9a] transition-colors duration-300">
                    {album.name}
                  </h2>
                  {album.description && (
                    <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                      {album.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
