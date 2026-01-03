"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { notFound } from "next/navigation";
import MarkdownContent from "@/components/MarkdownContent";

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
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readProgress, setReadProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${slug}`);
        if (!res.ok) {
          setArticle(null);
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setArticle(data);

        // Fetch all articles for navigation
        const allRes = await fetch("/api/articles?limit=50");
        const allData = await allRes.json();
        setAllArticles(allData.articles || []);
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

      const articleEl = articleRef.current;
      const articleTop = articleEl.offsetTop;
      const articleHeight = articleEl.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      const start = articleTop - windowHeight;
      const end = articleTop + articleHeight - windowHeight;
      const progress = Math.min(100, Math.max(0, ((scrollY - start) / (end - start)) * 100));
      setReadProgress(progress);

      const headings = articleEl.querySelectorAll("h2[id]");
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
      <div className="pt-16 md:pt-20 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    notFound();
  }

  const currentIndex = allArticles.findIndex((a) => a.slug === article.slug);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;
  const headings = extractHeadings(article.content);

  const relatedArticles = allArticles
    .filter((a) => a.category === article.category && a.slug !== article.slug)
    .slice(0, 2);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const top = element.offsetTop - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="pt-16 md:pt-20">
      {/* Reading Progress Bar */}
      <div className="fixed top-16 md:top-20 left-0 right-0 h-0.5 bg-stone-200 z-40">
        <div
          className="h-full bg-[#6b9e9a] transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Cover */}
      <div className="relative h-[40vh] md:h-[50vh]">
        <Image
          src={article.cover}
          alt={article.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fafaf8] via-transparent to-transparent" />
      </div>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8">
        <nav className="flex items-center gap-2 text-xs tracking-wider text-stone-400">
          <Link href="/" className="hover:text-[#6b9e9a] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#6b9e9a] transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-stone-600 truncate max-w-[200px]">{article.title}</span>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid lg:grid-cols-[1fr_280px] gap-12">
          {/* Article Content */}
          <article ref={articleRef} className="max-w-3xl">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs tracking-widest uppercase text-stone-400 mb-4">
              <span className="px-3 py-1 bg-[#6b9e9a]/10 text-[#6b9e9a] rounded-full">
                {article.category}
              </span>
              <span>{new Date(article.date).toLocaleDateString()}</span>
              <span>·</span>
              <span>{article.readTime} min read</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-8 text-stone-800 leading-tight">
              {article.title}
            </h1>

            {/* Author Info */}
            <div className="flex items-center gap-4 pb-8 mb-8 border-b border-stone-200">
              <div className="w-12 h-12 rounded-full bg-stone-200 overflow-hidden">
                <Image
                  src="https://picsum.photos/seed/author/100/100"
                  alt="WeiChieh"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-serif text-stone-700">WeiChieh</p>
                <p className="text-xs text-stone-400">Photographer & Writer</p>
              </div>
            </div>

            {/* Article Body */}
            <div className="prose prose-stone prose-lg max-w-none">
              <MarkdownContent content={article.content} />
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-stone-200">
                <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 text-sm bg-stone-100 text-stone-600 rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share Section */}
            <div className="mt-8 pt-8 border-t border-stone-200">
              <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">Share this article</p>
              <div className="flex gap-3">
                <button className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-8 pt-8 border-t border-stone-200">
              <div className="grid md:grid-cols-2 gap-4">
                {prevArticle ? (
                  <Link
                    href={`/blog/${prevArticle.slug}`}
                    className="group p-6 bg-stone-100 rounded-lg hover:bg-[#6b9e9a]/10 transition-colors"
                  >
                    <p className="text-xs tracking-widest uppercase text-stone-400 mb-2">← Previous</p>
                    <p className="font-serif text-stone-700 group-hover:text-[#6b9e9a] transition-colors line-clamp-2">
                      {prevArticle.title}
                    </p>
                  </Link>
                ) : (
                  <div />
                )}
                {nextArticle ? (
                  <Link
                    href={`/blog/${nextArticle.slug}`}
                    className="group p-6 bg-stone-100 rounded-lg hover:bg-[#6b9e9a]/10 transition-colors text-right"
                  >
                    <p className="text-xs tracking-widest uppercase text-stone-400 mb-2">Next →</p>
                    <p className="font-serif text-stone-700 group-hover:text-[#6b9e9a] transition-colors line-clamp-2">
                      {nextArticle.title}
                    </p>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </article>

          {/* Sidebar - Table of Contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              {headings.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">On this page</p>
                  <nav className="space-y-2">
                    {headings.map((heading) => (
                      <button
                        key={heading.id}
                        onClick={() => scrollToSection(heading.id)}
                        className={`block text-left text-sm py-1 transition-colors ${
                          activeSection === heading.id
                            ? "text-[#6b9e9a] font-medium"
                            : "text-stone-500 hover:text-stone-700"
                        }`}
                      >
                        {heading.title}
                      </button>
                    ))}
                  </nav>
                </div>
              )}

              <div className="h-px bg-stone-200 mb-8" />

              <Link
                href="/blog"
                className="flex items-center gap-2 text-sm text-stone-500 hover:text-[#6b9e9a] transition-colors"
              >
                <span>←</span>
                <span>All Articles</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Related Photos from this Article */}
      {article.photos && article.photos.length > 0 && (
        <section className="border-t border-stone-200 py-16 md:py-20 bg-stone-50/50">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <p className="text-xs tracking-widest uppercase text-[#6b9e9a] mb-2">Gallery</p>
            <h2 className="font-serif text-2xl md:text-3xl text-stone-700 mb-10">本文相關照片</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {article.photos.map((photo) => (
                <Link key={photo.slug} href={`/photo/${photo.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg mb-3">
                    <Image
                      src={photo.src}
                      alt={photo.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <p className="font-serif text-stone-700 group-hover:text-[#6b9e9a] transition-colors">
                    {photo.title}
                  </p>
                  <p className="text-xs text-stone-400">{photo.location}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="border-t border-stone-200 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <p className="text-xs tracking-widest uppercase text-stone-400 mb-2">More from {article.category}</p>
            <h2 className="font-serif text-2xl md:text-3xl text-stone-700 mb-10">Related Articles</h2>

            <div className="grid md:grid-cols-2 gap-8">
              {relatedArticles.map((related) => (
                <Link key={related.slug} href={`/blog/${related.slug}`} className="group">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-lg mb-4">
                    <Image
                      src={related.cover}
                      alt={related.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-400 mb-2">
                    <span className="text-[#6b9e9a]">{related.category}</span>
                    <span>·</span>
                    <span>{related.readTime} min read</span>
                  </div>
                  <h3 className="font-serif text-xl text-stone-700 group-hover:text-[#6b9e9a] transition-colors">
                    {related.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
