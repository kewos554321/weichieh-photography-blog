"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { notFound } from "next/navigation";
import MarkdownContent from "@/components/MarkdownContent";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { ShareButtons } from "@/components/ShareButtons";

interface ArticleTag {
  id: number;
  name: string;
}

interface LinkedPhoto {
  id: number;
  slug: string;
  title: string;
  src: string;
  location: string;
}

interface RelatedArticle {
  slug: string;
  title: string;
  cover: string;
  category: string;
  readTime: number;
}

interface NavigationArticle {
  slug: string;
  title: string;
}

interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover: string;
  category: string;
  readTime: number;
  date: string;
  tags: ArticleTag[];
  photos: LinkedPhoto[];
  related?: RelatedArticle[];
  navigation?: {
    prev: NavigationArticle | null;
    next: NavigationArticle | null;
  };
}

// Extract headings from content
function extractHeadings(content: string): { id: string; title: string }[] {
  const headings: { id: string; title: string }[] = [];
  const lines = content.split("\n");
  lines.forEach((line) => {
    if (line.startsWith("## ")) {
      const title = line.replace("## ", "").trim();
      const id = title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, "-");
      headings.push({ id, title });
    }
  });
  return headings;
}

export default function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      try {
        // Fetch article with context (related + navigation) in one request
        const res = await fetch(`/api/articles/${slug}?context=true`);
        if (!res.ok) {
          setArticle(null);
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setArticle(data);

        // Track view (fire and forget)
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "article", slug }),
        }).catch(() => {/* ignore tracking errors */});
      } catch (error) {
        console.error("Failed to fetch article:", error);
        setArticle(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;

      const headings = articleRef.current.querySelectorAll("h2[id]");
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top < 200) {
          setActiveSection(heading.id);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="pt-14 md:pt-16 min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-2 border-[var(--card-border)] border-t-[var(--accent-teal)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    notFound();
  }

  // Get navigation and related from article context
  const prevArticle = article.navigation?.prev || null;
  const nextArticle = article.navigation?.next || null;
  const headings = extractHeadings(article.content);
  const relatedArticles = article.related || [];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const top = element.offsetTop - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="pt-14 md:pt-16">
      {/* Reading Progress Bar */}
      <ReadingProgressBar targetRef={articleRef} />

      {/* Cover */}
      <div className="relative h-[40vh] md:h-[50vh]">
        <Image
          src={article.cover}
          alt={article.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />
      </div>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8">
        <nav className="flex items-center gap-2 text-xs tracking-wider text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--accent-teal)] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[var(--accent-teal)] transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-[var(--text-secondary)] truncate max-w-[200px]">{article.title}</span>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid lg:grid-cols-[1fr_280px] gap-12">
          {/* Article Content */}
          <article ref={articleRef} className="max-w-3xl">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs tracking-widest uppercase text-[var(--text-muted)] mb-4">
              <span className="px-3 py-1 bg-[var(--accent-teal)]/10 text-[var(--accent-teal)] rounded-full">
                {article.category}
              </span>
              <span>{new Date(article.date).toLocaleDateString()}</span>
              <span>·</span>
              <span>{article.readTime} min read</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-8 text-[var(--foreground)] leading-tight">
              {article.title}
            </h1>

            {/* Author Info */}
            <div className="flex items-center gap-4 pb-8 mb-8 border-b border-[var(--card-border)]">
              <div className="w-12 h-12 rounded-full bg-[var(--card-border)] overflow-hidden">
                <Image
                  src="https://picsum.photos/seed/author/100/100"
                  alt="WeiChieh"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-serif text-[var(--text-primary)]">WeiChieh</p>
                <p className="text-xs text-[var(--text-muted)]">Photographer & Writer</p>
              </div>
            </div>

            {/* Article Body */}
            <div className="prose prose-stone prose-lg max-w-none">
              <MarkdownContent content={article.content} />
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-[var(--card-border)]">
                <p className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-4">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 text-sm bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share Section */}
            <div className="mt-8 pt-8 border-t border-[var(--card-border)]">
              <p className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-4">Share this article</p>
              <ShareButtons title={article.title} />
            </div>

          </article>

          {/* Sidebar - Table of Contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              {headings.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-4">On this page</p>
                  <nav className="space-y-2">
                    {headings.map((heading) => (
                      <button
                        key={heading.id}
                        onClick={() => scrollToSection(heading.id)}
                        className={`block text-left text-sm py-1 transition-colors ${
                          activeSection === heading.id
                            ? "text-[var(--accent-teal)] font-medium"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {heading.title}
                      </button>
                    ))}
                  </nav>
                </div>
              )}

              <div className="h-px bg-[var(--card-border)] mb-8" />

              <Link
                href="/blog"
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-teal)] transition-colors"
              >
                <span>←</span>
                <span>All Posts</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Related Photos from this Article */}
      {article.photos && article.photos.length > 0 && (
        <section className="border-t border-[var(--card-border)] py-16 md:py-20 bg-[var(--card-bg)]/50">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <p className="text-xs tracking-widest uppercase text-[var(--accent-teal)] mb-2">Photos</p>
            <h2 className="font-serif text-2xl md:text-3xl text-[var(--text-primary)] mb-10">本文相關照片</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {article.photos.map((photo) => (
                <Link key={photo.slug} href={`/photo/${photo.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg mb-3">
                    <Image
                      src={photo.src}
                      alt={photo.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <p className="font-serif text-[var(--text-primary)] group-hover:text-[var(--accent-teal)] transition-colors">
                    {photo.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{photo.location}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="border-t border-[var(--card-border)] py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <p className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2">More from {article.category}</p>
            <h2 className="font-serif text-2xl md:text-3xl text-[var(--text-primary)] mb-10">Related Articles</h2>

            <div className="grid md:grid-cols-2 gap-8">
              {relatedArticles.map((related) => (
                <Link key={related.slug} href={`/blog/${related.slug}`} className="group">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-lg mb-4">
                    <Image
                      src={related.cover}
                      alt={related.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
                    <span className="text-[var(--accent-teal)]">{related.category}</span>
                    <span>·</span>
                    <span>{related.readTime} min read</span>
                  </div>
                  <h3 className="font-serif text-xl text-[var(--text-primary)] group-hover:text-[var(--accent-teal)] transition-colors">
                    {related.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Navigation - Same pattern as photo and album pages */}
      <section className="border-t border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3">
            {/* Previous */}
            {prevArticle ? (
              <Link
                href={`/blog/${prevArticle.slug}`}
                className="group flex items-center gap-4 p-6 md:p-10 hover:bg-[var(--card-bg)] transition-colors duration-300"
              >
                <span className="text-2xl text-[var(--text-muted)] group-hover:text-[var(--accent-teal)] transition-colors">←</span>
                <div className="hidden md:block">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] mb-1">Previous</p>
                  <p className="font-serif text-[var(--text-primary)] group-hover:text-[var(--accent-teal)] transition-colors line-clamp-1">{prevArticle.title}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {/* Back to Blog */}
            <Link
              href="/blog"
              className="flex items-center justify-center p-6 md:p-10 border-x border-[var(--card-border)] hover:bg-[var(--card-bg)] transition-colors duration-300"
            >
              <span className="text-xs tracking-[0.2em] uppercase text-[var(--text-secondary)] hover:text-[var(--accent-teal)] transition-colors">
                Back to Blog
              </span>
            </Link>

            {/* Next */}
            {nextArticle ? (
              <Link
                href={`/blog/${nextArticle.slug}`}
                className="group flex items-center justify-end gap-4 p-6 md:p-10 hover:bg-[var(--card-bg)] transition-colors duration-300"
              >
                <div className="hidden md:block text-right">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] mb-1">Next</p>
                  <p className="font-serif text-[var(--text-primary)] group-hover:text-[var(--accent-teal)] transition-colors line-clamp-1">{nextArticle.title}</p>
                </div>
                <span className="text-2xl text-[var(--text-muted)] group-hover:text-[var(--accent-teal)] transition-colors">→</span>
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
