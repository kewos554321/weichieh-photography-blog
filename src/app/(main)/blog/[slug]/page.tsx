import { Metadata } from "next";
import { getPostForMetadata } from "@/lib/seo";
import BlogPostClient from "./BlogPostClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostForMetadata(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.description,
    keywords: [post.category, "攝影", "Photography", "Blog"],
    openGraph: {
      title: post.title,
      description: post.description,
      url: post.url,
      siteName: "WeiChieh Photography",
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: "zh_TW",
      type: "article",
      publishedTime: post.date.toISOString(),
      authors: ["WeiChieh"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.image],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  return <BlogPostClient slug={slug} />;
}
