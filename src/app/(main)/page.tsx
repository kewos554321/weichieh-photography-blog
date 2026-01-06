import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PhotoWall } from "@/components/home/PhotoWall";

// 每 60 秒重新驗證資料
export const revalidate = 60;

const categories = ["All", "Portrait", "Landscape", "Street", "Nature"];

interface CoverPhotoSettings {
  photoId: number | null;
  photoSlug: string | null;
  photoSrc: string | null;
  photoTitle: string | null;
}

async function getPhotos() {
  const photos = await prisma.photo.findMany({
    where: {
      status: "published",
      visibility: "public",
      OR: [
        { publishedAt: null },
        { publishedAt: { lte: new Date() } },
      ],
    },
    orderBy: { date: "desc" },
    take: 50,
    select: {
      id: true,
      slug: true,
      src: true,
      title: true,
      category: true,
    },
  });
  return photos;
}

async function getCoverPhoto(): Promise<CoverPhotoSettings> {
  const settings = await prisma.siteSettings.findUnique({
    where: { key: "cover-photo" },
  });

  if (!settings) {
    return { photoId: null, photoSlug: null, photoSrc: null, photoTitle: null };
  }

  const coverSettings = settings.value as unknown as CoverPhotoSettings;

  if (coverSettings.photoId) {
    const photo = await prisma.photo.findUnique({
      where: { id: coverSettings.photoId },
      select: { id: true, slug: true, src: true, title: true, status: true, visibility: true },
    });

    // 封面只顯示已發佈且公開的照片
    if (!photo || photo.status !== "published" || photo.visibility !== "public") {
      return { photoId: null, photoSlug: null, photoSrc: null, photoTitle: null };
    }

    return {
      photoId: photo.id,
      photoSlug: photo.slug,
      photoSrc: photo.src,
      photoTitle: photo.title,
    };
  }

  return coverSettings;
}

export default async function Home() {
  const [photos, coverPhoto] = await Promise.all([
    getPhotos(),
    getCoverPhoto(),
  ]);

  // Use cover photo from settings, or fallback to first photo
  const featuredPhoto = coverPhoto?.photoId
    ? { slug: coverPhoto.photoSlug!, src: coverPhoto.photoSrc!, title: coverPhoto.photoTitle! }
    : photos[0];

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

      {/* Photo Wall (Client Component) */}
      <PhotoWall photos={photos} categories={categories} />

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
    </div>
  );
}
