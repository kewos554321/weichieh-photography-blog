"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { notFound } from "next/navigation";

const articles = [
  {
    id: 1,
    slug: "mountain-photography-tips",
    title: "山岳攝影的十個心得",
    date: "2024-12-15",
    cover: "https://picsum.photos/seed/blog1/1200/800",
    category: "技巧分享",
    readTime: 8,
    content: `
高山攝影一直是我最熱愛的題材之一。從第一次登上合歡山拍攝銀河，到後來挑戰玉山主峰的日出，每一次的經驗都讓我學到新的東西。

## 1. 做好充分的體能準備

高山攝影不只考驗攝影技術，更考驗體力。背著沉重的器材爬山，需要有足夠的體能支撐。我建議在出發前至少一個月開始訓練，包括負重登山和有氧運動。

## 2. 器材的取捨

在高山上，每一克重量都很重要。我通常只帶一機兩鏡：一顆廣角用於風景，一顆中長焦用於壓縮遠景。腳架選擇輕量的碳纖維款，雖然貴一點，但絕對值得。

## 3. 掌握天氣變化

高山天氣變化莫測。出發前要詳細研究天氣預報，但也要有應變的準備。有時候最戲劇性的光線，往往出現在天氣轉變的瞬間。

## 4. 善用黃金時刻

日出前後和日落前後的光線最為柔和、色彩最為豐富。我通常會在日出前一小時就定位，確保有充足的時間構圖和調整。

## 5. 保護好你的器材

高山上的環境對器材是一大挑戰。溫差大容易產生結露，風沙可能進入鏡頭。我會帶防水袋和吹球，隨時保護器材。

這些年來，高山教會我的不只是攝影技術，更是對自然的敬畏與謙卑。每一張照片背後，都是一段與山對話的過程。
    `,
  },
  {
    id: 2,
    slug: "tokyo-street-photography",
    title: "東京街頭攝影散記",
    date: "2024-11-28",
    cover: "https://picsum.photos/seed/blog2/1200/800",
    category: "旅行日記",
    readTime: 6,
    content: `
東京是一座讓攝影師永遠拍不完的城市。這次的旅行，我放慢腳步，用一週的時間漫遊在這座巨大的都市叢林中。

## 澀谷的混亂與秩序

澀谷十字路口是世界上最繁忙的行人穿越道之一。每當紅燈轉綠，數百人同時從四面八方湧入，卻又神奇地互不碰撞。我在這裡待了一整個下午，試圖捕捉這種混亂中的秩序。

## 淺草的傳統氛圍

與澀谷的現代感形成對比，淺草保留了老東京的韻味。雷門、仲見世通、淺草寺，這些經典的場景我用黑白來詮釋，試圖呈現一種跨越時空的感覺。

## 新宿的霓虹夜色

新宿是夜間攝影的天堂。歌舞伎町的霓虹燈、西口的高樓大廈、黃金街的小酒吧，每個角落都閃爍著獨特的光芒。我使用較高的 ISO 和大光圈，捕捉這座不夜城的魅力。

## 街頭攝影的心得

在東京街頭攝影，我學到最重要的一課是「等待」。有時候一個好的場景，需要等待對的人物走進畫面。耐心，是街頭攝影師最重要的品質。

這趟旅行讓我對街頭攝影有了新的理解。攝影不只是按下快門，更是一種觀察與理解城市的方式。
    `,
  },
  {
    id: 3,
    slug: "portrait-lighting-guide",
    title: "自然光人像攝影指南",
    date: "2024-11-10",
    cover: "https://picsum.photos/seed/blog3/1200/800",
    category: "技巧分享",
    readTime: 5,
    content: `
很多人以為拍出好的人像需要昂貴的燈具，但其實只要懂得運用自然光，就能創造出專業級的效果。

## 窗光的魔力

窗戶是最好的柔光箱。在陰天，窗光特別柔和均勻，是拍攝人像的最佳時機。讓被攝者面向窗戶，就能得到自然的倫勃朗光效果。

## 黃金時刻的運用

日出後和日落前的一小時，陽光呈現溫暖的金色調，非常適合人像攝影。這時候的光線柔和，不會在臉上產生過強的陰影。

## 陰影的重要性

好的人像攝影需要適度的陰影來塑造立體感。完全平光的人像會顯得扁平無趣。學會觀察光線的方向，利用陰影來雕塑臉部輪廓。

## 反光板的運用

一塊簡單的反光板就能大大改善人像效果。我常用白色反光板來填補陰影，讓光線更加均衡。沒有反光板時，一張白紙或白色牆壁也能達到類似效果。

自然光人像攝影的精髓在於觀察與感受。花時間理解光線的變化，你會發現最美的光線往往就在身邊。
    `,
  },
  {
    id: 4,
    slug: "film-vs-digital",
    title: "底片與數位：我的選擇",
    date: "2024-10-25",
    cover: "https://picsum.photos/seed/blog4/1200/800",
    category: "攝影思考",
    readTime: 7,
    content: `
在這個數位相機高度發達的時代，為什麼我仍然堅持使用底片？這是我經常被問到的問題。

## 底片的獨特質感

底片有一種數位難以複製的質感。那種自然的顆粒、獨特的色彩傾向、以及過渡層次的細膩，是底片獨有的魅力。每一款底片都有自己的個性，就像不同的畫筆。

## 放慢的節奏

使用底片強迫我放慢腳步。每一張照片都有成本，這讓我在按下快門前更加謹慎思考。這種慢節奏反而讓我更專注於眼前的畫面。

## 驚喜與期待

底片最迷人的地方在於等待。從按下快門到看到成品，中間的等待充滿了期待與驚喜。這種延遲的滿足感，是即時預覽的數位相機無法給予的。

## 數位的優勢

當然，數位攝影有它無可取代的優勢。即時回饋、高 ISO 表現、後製彈性，這些在某些場合是必要的。我在商業工作時主要使用數位，在個人創作時則偏好底片。

最終，底片與數位不是二選一的問題。它們是兩種不同的工具，適合不同的場合和心情。重要的是找到最適合你的方式。
    `,
  },
  {
    id: 5,
    slug: "taiwan-hidden-gems",
    title: "台灣秘境攝影地圖",
    date: "2024-10-08",
    cover: "https://picsum.photos/seed/blog5/1200/800",
    category: "旅行日記",
    readTime: 10,
    content: `
台灣雖小，卻有著豐富多變的地景。除了大家熟知的景點，還有許多不為人知的秘境等待被發現。

## 東北角的隱藏海岸

在東北角，有許多需要步行才能到達的海岸。這些地方遊客稀少，可以安靜地拍攝。我特別喜歡在颱風過後前往，巨浪拍打岩石的畫面非常震撼。

## 中部的雲海秘境

除了阿里山，台中和南投的山區也有絕佳的雲海觀賞點。這些地方比較少人知道，可以獨享美景。最佳時機是秋冬季節的清晨。

## 南部的老聚落

台南和高雄有許多保存完好的老聚落。狹窄的巷弄、斑駁的牆壁、老舊的木門，這些都是很好的攝影題材。我喜歡在下午時分前往，斜射的陽光為老屋增添溫暖的色調。

## 東部的原始森林

花蓮和台東的山區有大片原始森林。在這裡拍攝需要更多的準備和體力，但回報是值得的。那種原始、神秘的氛圍，是其他地方找不到的。

這些秘境需要時間去發現和探索。我建議大家離開熱門景點，走進台灣更深處的角落，你會發現這片土地的另一種美。
    `,
  },
  {
    id: 6,
    slug: "editing-workflow-2024",
    title: "2024 我的修圖流程",
    date: "2024-09-20",
    cover: "https://picsum.photos/seed/blog6/1200/800",
    category: "技巧分享",
    readTime: 6,
    content: `
經過多年的摸索，我終於建立了一套穩定的修圖流程。這套流程幫助我在保持品質的同時，也能有效率地處理大量照片。

## Lightroom：基礎調整

所有照片首先進入 Lightroom 進行基礎調整。我會先做白平衡校正，接著調整曝光和對比。這個階段的重點是還原現場看到的畫面。

## 色彩分級

我使用 Lightroom 的色彩分級功能來統一整組照片的色調。通常我會在陰影中加入一點藍色，在高光中加入一點暖色，這樣可以創造出電影感的色調。

## Photoshop：精細修飾

需要更精細處理的照片會進入 Photoshop。在這裡我會做局部的亮度調整、去除雜物、以及必要的修飾。我盡量保持修圖的自然，不過度處理。

## 輸出與備份

最後的步驟是輸出和備份。我會輸出不同尺寸的版本用於不同用途。所有原始檔和處理後的檔案都會備份到雲端和外接硬碟。

建立一套適合自己的流程需要時間。重要的是要不斷嘗試和調整，找到最適合你風格的方式。
    `,
  },
];

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
  const [readProgress, setReadProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;

      const article = articleRef.current;
      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Calculate read progress
      const start = articleTop - windowHeight;
      const end = articleTop + articleHeight - windowHeight;
      const progress = Math.min(100, Math.max(0, ((scrollY - start) / (end - start)) * 100));
      setReadProgress(progress);

      // Find active section
      const headings = article.querySelectorAll("h2[id]");
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

  if (!slug) return null;

  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  const currentIndex = articles.findIndex((a) => a.slug === article.slug);
  const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
  const nextArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;
  const headings = extractHeadings(article.content);

  // Get related articles (same category, excluding current)
  const relatedArticles = articles
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
              <span>{article.date}</span>
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
              {article.content.split("\n\n").map((paragraph, index) => {
                if (paragraph.startsWith("## ")) {
                  const title = paragraph.replace("## ", "");
                  const id = title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, "-");
                  return (
                    <h2
                      key={index}
                      id={id}
                      className="font-serif text-xl md:text-2xl mt-12 mb-6 text-stone-700 scroll-mt-24"
                    >
                      {title}
                    </h2>
                  );
                }
                if (paragraph.trim()) {
                  return (
                    <p key={index} className="text-stone-600 leading-relaxed mb-6">
                      {paragraph}
                    </p>
                  );
                }
                return null;
              })}
            </div>

            {/* Share Section */}
            <div className="mt-12 pt-8 border-t border-stone-200">
              <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">Share this article</p>
              <div className="flex gap-3">
                <button className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
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
            <div className="mt-12 pt-8 border-t border-stone-200">
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
              {/* Table of Contents */}
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

              {/* Divider */}
              <div className="h-px bg-stone-200 mb-8" />

              {/* Back to Blog */}
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
