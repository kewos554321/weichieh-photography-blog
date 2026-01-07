"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { BlurImage } from "@/components/BlurImage";

interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  cover: string;
  category: string;
  readTime: number;
}

const categories = ["全部", "技巧分享", "旅行日記", "攝影思考"];

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("全部");

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredArticles = activeCategory === "全部"
    ? articles
    : articles.filter(a => a.category === activeCategory);

  const featuredArticle = filteredArticles[0];
  const otherArticles = filteredArticles.slice(1);

  if (loading) {
    return (
      <div className="pt-14 md:pt-16 min-h-screen page-transition">
        {/* Header Skeleton */}
        <section className="py-12 md:py-20 px-4 md:px-6">
          <div className="max-w-7xl mx-auto text-center space-y-4">
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-12 w-48 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
        </section>
        <div className="flex items-center justify-center pb-12">
          <div className="h-px w-16 bg-[var(--card-border)]" />
          <div className="mx-4 w-2 h-2 rounded-full bg-[var(--accent-teal)]/50" />
          <div className="h-px w-16 bg-[var(--card-border)]" />
        </div>
        {/* Featured Skeleton */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
          <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
            <Skeleton className="aspect-[4/3] w-full rounded-sm" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </section>
        {/* Grid Skeleton */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[16/10] w-full rounded-sm" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-14 md:pt-16">
      {/* Page Header */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent-teal)] mb-4">Stories & Insights</p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--foreground)] mb-6">Blog</h1>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            分享攝影技巧、旅行故事，以及對影像創作的思考。<br className="hidden md:block" />
            每一篇文章都是一次深度對話。
          </p>
        </div>
      </section>

      {/* Decorative Divider */}
      <div className="flex items-center justify-center pb-12">
        <div className="h-px w-16 bg-[var(--card-border)]" />
        <div className="mx-4 w-2 h-2 rounded-full bg-[var(--accent-teal)]/50" />
        <div className="h-px w-16 bg-[var(--card-border)]" />
      </div>

      {articles.length === 0 ? (
        <section className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
          <div className="text-center py-20">
            <p className="text-[var(--text-muted)]">尚無文章</p>
          </div>
        </section>
      ) : (
        <>
          {/* Featured Article */}
          {featuredArticle && (
            <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16 md:pb-20">
              <div className="mb-8">
                <span className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)]">Featured Story</span>
              </div>
              <Link href={`/blog/${featuredArticle.slug}`} className="block group">
                <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                    <BlurImage
                      src={featuredArticle.cover}
                      alt={featuredArticle.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  {/* Content */}
                  <div className="py-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-[var(--accent-teal)]/10 text-[var(--accent-teal)] text-xs tracking-wider rounded-full">
                        {featuredArticle.category}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">{new Date(featuredArticle.date).toLocaleDateString()}</span>
                      <span className="text-xs text-[var(--text-muted)]">· {featuredArticle.readTime} min read</span>
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-[var(--foreground)] mb-4 group-hover:text-[var(--accent-teal)] transition-colors duration-500">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                      {featuredArticle.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm text-[var(--accent-teal)] group-hover:gap-3 transition-all duration-300">
                      閱讀全文 <span>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Divider */}
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="h-px bg-[var(--card-border)]" />
          </div>

          {/* Articles Grid */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
              <h3 className="font-serif text-2xl text-[var(--text-primary)]">All Articles</h3>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 text-xs tracking-wider border rounded-full transition-all duration-300 ${
                      activeCategory === cat
                        ? "border-[var(--accent-teal)] text-[var(--accent-teal)] bg-[var(--accent-teal)]/10"
                        : "border-[var(--card-border)] text-[var(--text-secondary)] hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {otherArticles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {otherArticles.map((article, index) => (
                  <article key={article.id} className="group">
                    <Link href={`/blog/${article.slug}`} className="block">
                      {/* Image */}
                      <div className="relative aspect-[16/10] overflow-hidden rounded-sm mb-5">
                        <BlurImage
                          src={article.cover}
                          alt={article.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {/* Number Badge */}
                        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[var(--card-bg)]/90 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">0{index + 2}</span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-3">
                        <span className="text-[var(--accent-teal)]">{article.category}</span>
                        <span>·</span>
                        <span>{new Date(article.date).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{article.readTime} min read</span>
                      </div>

                      {/* Title */}
                      <h2 className="font-serif text-xl mb-3 text-[var(--text-primary)] group-hover:text-[var(--accent-teal)] transition-colors duration-500 line-clamp-2">
                        {article.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-[var(--text-secondary)] text-sm leading-relaxed line-clamp-2 mb-4">
                        {article.excerpt}
                      </p>

                      {/* Read More */}
                      <span className="text-xs tracking-wider text-[var(--text-muted)] group-hover:text-[var(--accent-teal)] transition-colors duration-300">
                        Read More →
                      </span>
                    </Link>
                  </article>
                ))}
              </div>
            ) : filteredArticles.length <= 1 ? (
              <div className="text-center py-10">
                <p className="text-[var(--text-muted)]">此分類尚無其他文章</p>
              </div>
            ) : null}
          </section>
        </>
      )}

      {/* Newsletter Section */}
      <section className="border-t border-[var(--card-border)] bg-[var(--card-bg)]/50 py-16 md:py-24">
        <div className="max-w-2xl mx-auto px-4 md:px-6 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent-teal)] mb-4">Stay Updated</p>
          <h2 className="font-serif text-2xl md:text-3xl text-[var(--text-primary)] mb-4">訂閱電子報</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-8">每週精選攝影文章與獨家內容，直接送到你的信箱。</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 bg-[var(--background)] border border-[var(--card-border)] rounded-full text-sm focus:outline-none focus:border-[var(--accent-teal)] transition-colors text-[var(--foreground)]"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] text-sm tracking-wider rounded-full hover:bg-[var(--accent-teal)] transition-colors duration-300"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
