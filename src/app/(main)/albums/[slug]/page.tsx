"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { ArrowLeft, Images, MapPin, Calendar } from "lucide-react";

interface Photo {
  id: number;
  slug: string;
  src: string;
  title: string;
  category: string;
  location: string;
  date: string;
}

interface Album {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  photos: Photo[];
}

export default function AlbumDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/albums/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setAlbum(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-16 md:pt-20 min-h-screen flex items-center justify-center">
        <div className="text-stone-400">Loading...</div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="pt-16 md:pt-20 min-h-screen flex flex-col items-center justify-center">
        <p className="text-stone-400 mb-4">找不到此相簿</p>
        <Link
          href="/albums"
          className="text-[#6b9e9a] hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回相簿列表
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-16 md:pt-20 min-h-screen">
      {/* Header */}
      <section className="py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Link */}
          <Link
            href="/albums"
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#6b9e9a] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回相簿
          </Link>

          {/* Album Header */}
          <div className="text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-[#6b9e9a] mb-3">
              Collection
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-stone-800 mb-4">
              {album.name}
            </h1>
            {album.description && (
              <p className="text-stone-500 font-light max-w-2xl mx-auto mb-4">
                {album.description}
              </p>
            )}
            <p className="text-sm text-stone-400 flex items-center justify-center gap-1">
              <Images className="w-4 h-4" />
              {album.photos.length} 張照片
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="flex items-center justify-center gap-4 px-4">
        <div className="h-px w-16 bg-stone-200" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#6b9e9a]" />
        <div className="h-px w-16 bg-stone-200" />
      </div>

      {/* Photos Grid - Masonry */}
      <section className="py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {album.photos.length === 0 ? (
            <div className="text-center py-20">
              <Images className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-400">此相簿尚無照片</p>
            </div>
          ) : (
            <div
              className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4"
              style={{ columnFill: "balance" }}
            >
              {album.photos.map((photo) => (
                <Link
                  key={photo.id}
                  href={`/photo/${photo.slug}`}
                  className="group block mb-3 md:mb-4 break-inside-avoid"
                >
                  <div className="relative rounded-sm overflow-hidden bg-stone-100">
                    <Image
                      src={photo.src}
                      alt={photo.title}
                      width={600}
                      height={800}
                      className="w-full h-auto transition-all duration-700 group-hover:scale-[1.03]"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {/* Photo Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <h3 className="font-serif text-white text-sm md:text-base mb-1 line-clamp-1">
                        {photo.title}
                      </h3>
                      <div className="flex items-center gap-3 text-white/80 text-xs">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {photo.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(photo.date).toLocaleDateString("zh-TW", {
                            year: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
