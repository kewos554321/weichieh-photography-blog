export interface PhotoTag {
  id: number;
  name: string;
  _count?: { photos: number };
}

export interface MediaTag {
  id: number;
  name: string;
  _count?: { media: number };
}

export interface MediaFolder {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  _count?: { media: number };
}

export interface ImageVariants {
  thumb: string;  // 256px
  sm: string;     // 640px
  md: string;     // 1200px
  lg: string;     // 1920px
  original: string;
}

export interface Media {
  id: number;
  filename: string;
  url: string;
  key: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  variants: ImageVariants | null;
  tags: MediaTag[];
  folder: MediaFolder | null;
  folderId: number | null;
  createdAt: string;
  updatedAt: string;
  _usage?: {
    photoCount: number;
    postCount: number;
  };
}

export interface MediaWithUsage extends Media {
  usage: {
    photos: Array<{ id: number; slug: string; title: string }>;
    posts: Array<{ id: number; slug: string; title: string }>;
  };
}

export interface MediaListResponse {
  media: Media[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type FilterType = "none" | "bw" | "vintage" | "cinematic" | "warm" | "cool";

export interface ImageEdits {
  crop?: { x: number; y: number; width: number; height: number };
  rotation?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  filter?: FilterType;
}

export interface PostTag {
  id: number;
  name: string;
  _count?: { posts: number };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface Photo {
  id: number;
  slug: string;
  title: string;
  src: string;
  category: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  date: string;
  camera?: string;
  lens?: string;
  story: string;
  behindTheScene?: string;
  status: "draft" | "scheduled" | "published";
  visibility: "public" | "private";
  publishedAt?: string;
  tags: PhotoTag[];
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  cover: string;
  category: string;
  excerpt: string;
  content: string;
  date: string;
  status: "draft" | "scheduled" | "published";
  publishedAt?: string;
  readTime: number;
  tags: PostTag[];
}

export interface ProfileData {
  name: string;
  title: string;
  bio: string;
  avatar: string;
  email: string;
  location: string;
  socialLinks: {
    instagram: string;
    twitter: string;
    youtube: string;
    website: string;
  };
  equipment: {
    cameras: string[];
    lenses: string[];
    accessories: string[];
  };
  philosophy: string;
  services: string[];
}

export interface SEOData {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string[];
  ogImage: string;
  twitterHandle: string;
  googleAnalyticsId: string;
  googleSearchConsoleId: string;
  facebookPixelId: string;
}

export interface AnalyticsData {
  overview: {
    totalPhotos: number;
    totalPosts: number;
    publishedPhotos: number;
    publishedPosts: number;
    draftPhotos: number;
    draftPosts: number;
    totalViews: number;
    photoViews: number;
    postViews: number;
    recentPhotos: number;
    recentPosts: number;
  };
  topPhotos: Array<{
    id: number;
    slug: string;
    title: string;
    src: string;
    viewCount: number;
    category: string;
  }>;
  topPosts: Array<{
    id: number;
    slug: string;
    title: string;
    cover: string;
    viewCount: number;
    category: string;
  }>;
  photoCategoryStats: Array<{
    category: string;
    count: number;
    views: number;
  }>;
  postCategoryStats: Array<{
    category: string;
    count: number;
    views: number;
  }>;
}
