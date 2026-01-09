import { Metadata } from "next";
import { getPhotoForMetadata } from "@/lib/seo";
import PhotoPageClient from "./PhotoPageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const photo = await getPhotoForMetadata(slug);

  if (!photo) {
    return {
      title: "Photo Not Found",
    };
  }

  return {
    title: photo.title,
    description: photo.description,
    keywords: [photo.category, photo.location, "攝影", "Photography"],
    openGraph: {
      title: photo.title,
      description: photo.description,
      url: photo.url,
      siteName: "WeiChieh Photography",
      images: [
        {
          url: photo.image,
          width: 1200,
          height: 630,
          alt: photo.title,
        },
      ],
      locale: "zh_TW",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: photo.title,
      description: photo.description,
      images: [photo.image],
    },
  };
}

export default async function PhotoPage({ params }: Props) {
  const { slug } = await params;
  return <PhotoPageClient slug={slug} />;
}
