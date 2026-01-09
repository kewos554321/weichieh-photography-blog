import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://weichieh.photography";

export interface PhotoMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
  category: string;
  location: string;
  date: Date;
}

export interface PostMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
  category: string;
  date: Date;
  readTime: number;
}

export async function getPhotoForMetadata(slug: string): Promise<PhotoMetadata | null> {
  const photo = await prisma.photo.findUnique({
    where: { slug },
    select: {
      title: true,
      story: true,
      src: true,
      category: true,
      location: true,
      date: true,
      status: true,
      visibility: true,
      publishedAt: true,
    },
  });

  if (!photo) return null;

  // 只返回已發佈且公開的照片
  const isPublished = photo.status === "published";
  const isScheduleReady = !photo.publishedAt || photo.publishedAt <= new Date();
  const isPublic = photo.visibility === "public";

  if (!isPublished || !isScheduleReady || !isPublic) {
    return null;
  }

  return {
    title: photo.title,
    description: photo.story.slice(0, 160) + (photo.story.length > 160 ? "..." : ""),
    image: photo.src,
    url: `${BASE_URL}/photo/${slug}`,
    category: photo.category,
    location: photo.location,
    date: photo.date,
  };
}

export async function getPostForMetadata(slug: string): Promise<PostMetadata | null> {
  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      cover: true,
      category: true,
      publishedAt: true,
      status: true,
      readTime: true,
    },
  });

  if (!post) return null;

  // 只返回已發佈的文章
  const isPublished = post.status === "published";
  const isScheduleReady = !post.publishedAt || post.publishedAt <= new Date();

  if (!isPublished || !isScheduleReady) {
    return null;
  }

  return {
    title: post.title,
    description: post.excerpt.slice(0, 160) + (post.excerpt.length > 160 ? "..." : ""),
    image: post.cover,
    url: `${BASE_URL}/blog/${slug}`,
    category: post.category,
    date: post.publishedAt || new Date(),
    readTime: post.readTime,
  };
}
