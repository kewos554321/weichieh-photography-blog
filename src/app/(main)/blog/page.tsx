"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

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
      <div className="pt-16 md:pt-20 min-h-screen flex items-center justify-center">
        <div className="text-stone-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="pt-16 md:pt-20">
      {/* Page Header */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#6b9e9a] mb-4">Stories & Insights</p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-800 mb-6">Blog</h1>
          <p className="text-stone-500 max-w-2xl mx-auto leading-relaxed">
            分享攝影技巧、旅行故事，以及對影像創作的思考。<br className="hidden md:block" />
            每一篇文章都是一次深度對話。
          </p>
        </div>
      </section>

      {/* Decorative Divider */}
      <div className="flex items-center justify-center pb-12">
        <div className="h-px w-16 bg-stone-300" />
        <div className="mx-4 w-2 h-2 rounded-full bg-[#6b9e9a]/50" />
        <div className="h-px w-16 bg-stone-300" />
      </div>

      {articles.length === 0 ? (
        <section className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
          <div className="text-center py-20">
            <p className="text-stone-400">尚無文章</p>
          </div>
        </section>
      ) : (
        <>
          {/* Featured Article */}
          {featuredArticle && (
            <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16 md:pb-20">
              <div className="mb-8">
                <span className="text-xs tracking-[0.2em] uppercase text-stone-400">Featured Story</span>
              </div>
              <Link href={`/blog/${featuredArticle.slug}`} className="block group">
                <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                    <Image
                      src={featuredArticle.cover}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  {/* Content */}
                  <div className="py-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-[#6b9e9a]/10 text-[#6b9e9a] text-xs tracking-wider rounded-full">
                        {featuredArticle.category}
                      </span>
                      <span className="text-xs text-stone-400">{new Date(featuredArticle.date).toLocaleDateString()}</span>
                      <span className="text-xs text-stone-400">· {featuredArticle.readTime} min read</span>
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-stone-800 mb-4 group-hover:text-[#6b9e9a] transition-colors duration-500">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-stone-500 leading-relaxed mb-6">
                      {featuredArticle.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm text-[#6b9e9a] group-hover:gap-3 transition-all duration-300">
                      閱讀全文 <span>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Divider */}
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="h-px bg-stone-200" />
          </div>

          {/* Articles Grid */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
              <h3 className="font-serif text-2xl text-stone-700">All Articles</h3>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 text-xs tracking-wider border rounded-full transition-all duration-300 ${
                      activeCategory === cat
                        ? "border-[#6b9e9a] text-[#6b9e9a] bg-[#6b9e9a]/10"
                        : "border-stone-300 text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a]"
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
                        <Image
                          src={article.cover}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {/* Number Badge */}
                        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-xs font-medium text-stone-600">0{index + 2}</span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-2 text-xs text-stone-400 mb-3">
                        <span className="text-[#6b9e9a]">{article.category}</span>
                        <span>·</span>
                        <span>{new Date(article.date).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{article.readTime} min read</span>
                      </div>

                      {/* Title */}
                      <h2 className="font-serif text-xl mb-3 text-stone-700 group-hover:text-[#6b9e9a] transition-colors duration-500 line-clamp-2">
                        {article.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-4">
                        {article.excerpt}
                      </p>

                      {/* Read More */}
                      <span className="text-xs tracking-wider text-stone-400 group-hover:text-[#6b9e9a] transition-colors duration-300">
                        Read More →
                      </span>
                    </Link>
                  </article>
                ))}
              </div>
            ) : filteredArticles.length <= 1 ? (
              <div className="text-center py-10">
                <p className="text-stone-400">此分類尚無其他文章</p>
              </div>
            ) : null}
          </section>
        </>
      )}

      {/* Newsletter Section */}
      <section className="border-t border-stone-200 bg-stone-100/50 py-16 md:py-24">
        <div className="max-w-2xl mx-auto px-4 md:px-6 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#6b9e9a] mb-4">Stay Updated</p>
          <h2 className="font-serif text-2xl md:text-3xl text-stone-700 mb-4">訂閱電子報</h2>
          <p className="text-stone-500 text-sm mb-8">每週精選攝影文章與獨家內容，直接送到你的信箱。</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 bg-white border border-stone-300 rounded-full text-sm focus:outline-none focus:border-[#6b9e9a] transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-stone-800 text-white text-sm tracking-wider rounded-full hover:bg-[#6b9e9a] transition-colors duration-300"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
