import Image from "next/image";
import Link from "next/link";

const articles = [
  {
    id: 1,
    slug: "mountain-photography-tips",
    title: "山岳攝影的十個心得",
    excerpt: "從阿里山到玉山，這些年來我累積了一些高山攝影的經驗，希望能幫助到想要挑戰山岳攝影的朋友。",
    date: "2024-12-15",
    cover: "https://picsum.photos/seed/blog1/800/500",
    category: "技巧分享",
    readTime: "8 min",
  },
  {
    id: 2,
    slug: "tokyo-street-photography",
    title: "東京街頭攝影散記",
    excerpt: "在東京的街頭遊走一週，用鏡頭記錄下這座城市的日常。從澀谷的十字路口到淺草的小巷，每個角落都有故事。",
    date: "2024-11-28",
    cover: "https://picsum.photos/seed/blog2/800/500",
    category: "旅行日記",
    readTime: "6 min",
  },
  {
    id: 3,
    slug: "portrait-lighting-guide",
    title: "自然光人像攝影指南",
    excerpt: "不需要昂貴的燈具，只要懂得運用自然光，就能拍出動人的人像作品。這篇文章分享我多年來的自然光運用心得。",
    date: "2024-11-10",
    cover: "https://picsum.photos/seed/blog3/800/500",
    category: "技巧分享",
    readTime: "5 min",
  },
  {
    id: 4,
    slug: "film-vs-digital",
    title: "底片與數位：我的選擇",
    excerpt: "在這個數位時代，為什麼我仍然堅持使用底片？這不只是關於畫質，更是關於攝影的態度與節奏。",
    date: "2024-10-25",
    cover: "https://picsum.photos/seed/blog4/800/500",
    category: "攝影思考",
    readTime: "7 min",
  },
  {
    id: 5,
    slug: "taiwan-hidden-gems",
    title: "台灣秘境攝影地圖",
    excerpt: "除了熱門的觀光景點，台灣還有許多不為人知的美麗角落。這篇文章整理了我私藏的拍攝地點。",
    date: "2024-10-08",
    cover: "https://picsum.photos/seed/blog5/800/500",
    category: "旅行日記",
    readTime: "10 min",
  },
  {
    id: 6,
    slug: "editing-workflow-2024",
    title: "2024 我的修圖流程",
    excerpt: "從 Lightroom 到 Photoshop，分享我目前的後製工作流程，以及如何在效率與品質之間取得平衡。",
    date: "2024-09-20",
    cover: "https://picsum.photos/seed/blog6/800/500",
    category: "技巧分享",
    readTime: "6 min",
  },
];

const categories = ["全部", "技巧分享", "旅行日記", "攝影思考"];

export default function BlogPage() {
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

      {/* Featured Article */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16 md:pb-20">
        <div className="mb-8">
          <span className="text-xs tracking-[0.2em] uppercase text-stone-400">Featured Story</span>
        </div>
        <Link href={`/blog/${articles[0].slug}`} className="block group">
          <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
              <Image
                src={articles[0].cover}
                alt={articles[0].title}
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
                  {articles[0].category}
                </span>
                <span className="text-xs text-stone-400">{articles[0].date}</span>
                <span className="text-xs text-stone-400">· {articles[0].readTime} read</span>
              </div>
              <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-stone-800 mb-4 group-hover:text-[#6b9e9a] transition-colors duration-500">
                {articles[0].title}
              </h2>
              <p className="text-stone-500 leading-relaxed mb-6">
                {articles[0].excerpt}
              </p>
              <span className="inline-flex items-center gap-2 text-sm text-[#6b9e9a] group-hover:gap-3 transition-all duration-300">
                閱讀全文 <span>→</span>
              </span>
            </div>
          </div>
        </Link>
      </section>

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
                className="px-4 py-1.5 text-xs tracking-wider border border-stone-300 rounded-full text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-all duration-300"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {articles.slice(1).map((article, index) => (
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
                  <span>{article.date}</span>
                  <span>·</span>
                  <span>{article.readTime} read</span>
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
      </section>

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
