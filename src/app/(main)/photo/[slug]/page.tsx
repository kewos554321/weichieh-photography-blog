"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CommentForm, CommentList } from "@/components/comments";
import { LikeButton } from "@/components/photo";

interface PhotoTag {
  id: number;
  name: string;
}

interface LinkedArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  status: string;
}

interface LinkedAlbum {
  album: {
    id: number;
    slug: string;
    name: string;
    isPublic: boolean;
  };
}

interface Photo {
  id: number;
  slug: string;
  src: string;
  category: string;
  title: string;
  date: string;
  location: string;
  camera?: string;
  lens?: string;
  story: string;
  behindTheScene?: string;
  tags: PhotoTag[];
  article?: LinkedArticle;
  albums?: LinkedAlbum[];
}

export default function PhotoPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [relatedPhotos, setRelatedPhotos] = useState<Photo[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const fetchPhoto = async () => {
      try {
        // Fetch single photo
        const res = await fetch(`/api/photos/${slug}`);

        if (!res.ok) {
          setPhoto(null);
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setPhoto(data);

        // Track view
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "photo", slug }),
        }).catch(() => {/* ignore tracking errors */});

        // Fetch all photos for navigation and related
        const allRes = await fetch("/api/photos?limit=100");
        const allData = await allRes.json();
        setAllPhotos(allData.photos || []);

        // Get related photos (same category)
        const related = (allData.photos || [])
          .filter((p: Photo) => p.category === data.category && p.slug !== data.slug)
          .slice(0, 4);
        setRelatedPhotos(related);
      } catch (error) {
        console.error("Failed to fetch photo:", error);
        setPhoto(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhoto();
  }, [slug]);

  const currentIndex = photo ? allPhotos.findIndex((p) => p.slug === photo.slug) : -1;
  const prevPhoto = currentIndex > 0 ? allPhotos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < allPhotos.length - 1 ? allPhotos[currentIndex + 1] : null;

  if (isLoading) {
    return (
      <div className="pt-16 md:pt-20 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!photo) {
    notFound();
  }

  return (
    <div className="pt-16 md:pt-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <nav className="flex items-center gap-2 text-xs tracking-wider text-stone-400">
          <Link href="/" className="hover:text-[#6b9e9a] transition-colors">
            Photos
          </Link>
          <span>/</span>
          <span className="text-[#6b9e9a]">{photo.category}</span>
          <span>/</span>
          <span className="text-stone-600">{photo.title}</span>
        </nav>
      </div>

      {/* Hero Section - Image Left, Info Right */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-12 md:pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm group">
            <Image
              src={photo.src}
              alt={photo.title}
              fill
              className={`object-cover transition-all duration-700 ${isImageLoaded ? "opacity-100" : "opacity-0"} group-hover:scale-[1.02]`}
              priority
              onLoad={() => setIsImageLoaded(true)}
            />
            {/* Image loading skeleton */}
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-stone-200 animate-pulse" />
            )}
          </div>

          {/* Info */}
          <div className="lg:py-4">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs tracking-[0.2em] uppercase text-stone-400 mb-6">
              <span className="px-3 py-1 bg-[#6b9e9a]/10 text-[#6b9e9a] rounded-full">
                {photo.category}
              </span>
              <span>{photo.location}</span>
              <span>·</span>
              <span>{new Date(photo.date).toLocaleDateString()}</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-stone-800 mb-6 md:mb-8">
              {photo.title}
            </h1>

            {/* Story */}
            <p className="text-stone-600 leading-relaxed mb-6 text-lg">
              {photo.story}
            </p>

            {/* Read Full Story Button */}
            {photo.article && photo.article.status === "published" && (
              <Link
                href={`/blog/${photo.article.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 bg-[#6b9e9a] text-white rounded-full hover:bg-[#5a8a87] transition-colors group"
              >
                <span>閱讀完整故事</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}

            {/* Technical Info */}
            {(photo.camera || photo.lens) && (
              <div className="grid grid-cols-2 gap-6 py-6 border-t border-b border-stone-200 mb-8">
                {photo.camera && (
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1">Camera</p>
                    <p className="text-sm text-stone-700 font-medium">{photo.camera}</p>
                  </div>
                )}
                {photo.lens && (
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1">Lens</p>
                    <p className="text-sm text-stone-700 font-medium">{photo.lens}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {photo.tags && photo.tags.length > 0 && (
              <div className="mb-8">
                <p className="text-xs tracking-widest uppercase text-stone-400 mb-3">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {photo.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 text-xs bg-stone-100 text-stone-600 rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Albums - 收錄於 */}
            {photo.albums && photo.albums.filter(a => a.album.isPublic).length > 0 && (
              <div className="mb-8">
                <p className="text-xs tracking-widest uppercase text-stone-400 mb-3">Included in</p>
                <div className="flex flex-wrap gap-2">
                  {photo.albums
                    .filter(a => a.album.isPublic)
                    .map((albumPhoto) => (
                      <Link
                        key={albumPhoto.album.id}
                        href={`/albums/${albumPhoto.album.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#6b9e9a]/10 text-[#6b9e9a] rounded-full hover:bg-[#6b9e9a]/20 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {albumPhoto.album.name}
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* Like & Share */}
            <div className="flex items-center gap-6">
              {/* Like Button */}
              <LikeButton photoSlug={photo.slug} />

              {/* Share Buttons */}
              <div className="flex gap-2">
                <button className="w-9 h-9 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </button>
                <button className="w-9 h-9 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </button>
                <button className="w-9 h-9 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Behind The Scene */}
      {photo.behindTheScene && (
        <section className="border-t border-stone-200 bg-stone-50/50">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <p className="text-xs tracking-[0.3em] uppercase text-[#6b9e9a] mb-4">Behind The Scene</p>
            <h2 className="font-serif text-2xl md:text-3xl text-stone-800 mb-8">拍攝故事</h2>
            <p className="text-stone-600 leading-loose text-lg">
              {photo.behindTheScene}
            </p>
          </div>
        </section>
      )}

      {/* Related Photos */}
      {relatedPhotos.length > 0 && (
        <section className="border-t border-stone-200 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-xs tracking-widest uppercase text-stone-400 mb-2">More {photo.category}</p>
                <h2 className="font-serif text-2xl md:text-3xl text-stone-700">Related Photos</h2>
              </div>
              <Link
                href="/"
                className="text-sm text-stone-500 hover:text-[#6b9e9a] transition-colors flex items-center gap-2"
              >
                View All <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedPhotos.map((related) => (
                <Link key={related.slug} href={`/photo/${related.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-sm mb-3">
                    <Image
                      src={related.src}
                      alt={related.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <p className="font-serif text-stone-700 group-hover:text-[#6b9e9a] transition-colors">
                    {related.title}
                  </p>
                  <p className="text-xs text-stone-400">{related.location}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Comments Section */}
      <section className="border-t border-stone-200 bg-stone-50/30">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Comment Form */}
            <div>
              <h2 className="font-serif text-xl md:text-2xl text-stone-800 mb-6">
                留下您的想法
              </h2>
              <CommentForm
                photoId={photo.id}
                onSuccess={() => setCommentRefreshKey((k) => k + 1)}
              />
            </div>

            {/* Comment List */}
            <div>
              <CommentList
                photoSlug={photo.slug}
                refreshKey={commentRefreshKey}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="border-t border-stone-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3">
            {/* Previous */}
            {prevPhoto ? (
              <Link
                href={`/photo/${prevPhoto.slug}`}
                className="group flex items-center gap-4 p-6 md:p-10 hover:bg-stone-50 transition-colors duration-300"
              >
                <span className="text-2xl text-stone-300 group-hover:text-[#6b9e9a] transition-colors">←</span>
                <div className="hidden md:block">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1">Previous</p>
                  <p className="font-serif text-stone-700 group-hover:text-[#6b9e9a] transition-colors">{prevPhoto.title}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {/* Back to Photos */}
            <Link
              href="/"
              className="flex items-center justify-center p-6 md:p-10 border-x border-stone-200 hover:bg-stone-50 transition-colors duration-300"
            >
              <span className="text-xs tracking-[0.2em] uppercase text-stone-500 hover:text-[#6b9e9a] transition-colors">
                Back to Photos
              </span>
            </Link>

            {/* Next */}
            {nextPhoto ? (
              <Link
                href={`/photo/${nextPhoto.slug}`}
                className="group flex items-center justify-end gap-4 p-6 md:p-10 hover:bg-stone-50 transition-colors duration-300"
              >
                <div className="hidden md:block text-right">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1">Next</p>
                  <p className="font-serif text-stone-700 group-hover:text-[#6b9e9a] transition-colors">{nextPhoto.title}</p>
                </div>
                <span className="text-2xl text-stone-300 group-hover:text-[#6b9e9a] transition-colors">→</span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
