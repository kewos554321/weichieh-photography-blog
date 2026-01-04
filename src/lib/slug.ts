import { prisma } from "./prisma";

/**
 * Generate a URL-friendly slug from a title
 * - Converts to lowercase
 * - Replaces spaces and special characters with hyphens
 * - Removes non-alphanumeric characters (except hyphens)
 * - Removes consecutive hyphens
 * - Removes leading/trailing hyphens
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/[^\w\u4e00-\u9fff-]/g, "") // Keep alphanumeric, Chinese chars, and hyphens
    .replace(/[\u4e00-\u9fff]+/g, "") // Remove Chinese characters (they don't work well in URLs)
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug for Photo
 * If slug exists, append -1, -2, etc.
 */
export async function generateUniquePhotoSlug(
  title: string,
  excludeSlug?: string
): Promise<string> {
  const baseSlug = generateSlugFromTitle(title);

  if (!baseSlug) {
    // If title only has Chinese chars, use timestamp
    return `photo-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.photo.findUnique({
      where: { slug },
      select: { slug: true },
    });

    // If not found, or found but it's the same record we're updating
    if (!existing || (excludeSlug && existing.slug === excludeSlug)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Generate a unique slug for Article
 * If slug exists, append -1, -2, etc.
 */
export async function generateUniqueArticleSlug(
  title: string,
  excludeSlug?: string
): Promise<string> {
  const baseSlug = generateSlugFromTitle(title);

  if (!baseSlug) {
    // If title only has Chinese chars, use timestamp
    return `article-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.article.findUnique({
      where: { slug },
      select: { slug: true },
    });

    // If not found, or found but it's the same record we're updating
    if (!existing || (excludeSlug && existing.slug === excludeSlug)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Generate a unique slug for Album
 * If slug exists, append -1, -2, etc.
 */
export async function generateUniqueAlbumSlug(
  name: string,
  excludeSlug?: string
): Promise<string> {
  const baseSlug = generateSlugFromTitle(name);

  if (!baseSlug) {
    // If name only has Chinese chars, use timestamp
    return `album-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.album.findUnique({
      where: { slug },
      select: { slug: true },
    });

    // If not found, or found but it's the same record we're updating
    if (!existing || (excludeSlug && existing.slug === excludeSlug)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
