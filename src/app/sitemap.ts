import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://weichieh.photography";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 靜態頁面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/albums`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/map`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  // 取得已發佈的照片
  const photos = await prisma.photo.findMany({
    where: {
      status: "published",
      visibility: "public",
      OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
    },
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { date: "desc" },
  });

  const photoPages: MetadataRoute.Sitemap = photos.map((photo) => ({
    url: `${BASE_URL}/photo/${photo.slug}`,
    lastModified: photo.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // 取得已發佈的文章
  const posts = await prisma.post.findMany({
    where: {
      status: "published",
      OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
    },
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // 取得公開的相簿
  const albums = await prisma.album.findMany({
    where: {
      visibility: "public",
    },
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const albumPages: MetadataRoute.Sitemap = albums.map((album) => ({
    url: `${BASE_URL}/albums/${album.slug}`,
    lastModified: album.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...photoPages, ...postPages, ...albumPages];
}
