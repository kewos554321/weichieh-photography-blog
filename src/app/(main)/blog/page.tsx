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
  },
  {
    id: 2,
    slug: "tokyo-street-photography",
    title: "東京街頭攝影散記",
    excerpt: "在東京的街頭遊走一週，用鏡頭記錄下這座城市的日常。從澀谷的十字路口到淺草的小巷，每個角落都有故事。",
    date: "2024-11-28",
    cover: "https://picsum.photos/seed/blog2/800/500",
    category: "旅行日記",
  },
  {
    id: 3,
    slug: "portrait-lighting-guide",
    title: "自然光人像攝影指南",
    excerpt: "不需要昂貴的燈具，只要懂得運用自然光，就能拍出動人的人像作品。這篇文章分享我多年來的自然光運用心得。",
    date: "2024-11-10",
    cover: "https://picsum.photos/seed/blog3/800/500",
    category: "技巧分享",
  },
  {
    id: 4,
    slug: "film-vs-digital",
    title: "底片與數位：我的選擇",
    excerpt: "在這個數位時代，為什麼我仍然堅持使用底片？這不只是關於畫質，更是關於攝影的態度與節奏。",
    date: "2024-10-25",
    cover: "https://picsum.photos/seed/blog4/800/500",
    category: "攝影思考",
  },
  {
    id: 5,
    slug: "taiwan-hidden-gems",
    title: "台灣秘境攝影地圖",
    excerpt: "除了熱門的觀光景點，台灣還有許多不為人知的美麗角落。這篇文章整理了我私藏的拍攝地點。",
    date: "2024-10-08",
    cover: "https://picsum.photos/seed/blog5/800/500",
    category: "旅行日記",
  },
  {
    id: 6,
    slug: "editing-workflow-2024",
    title: "2024 我的修圖流程",
    excerpt: "從 Lightroom 到 Photoshop，分享我目前的後製工作流程，以及如何在效率與品質之間取得平衡。",
    date: "2024-09-20",
    cover: "https://picsum.photos/seed/blog6/800/500",
    category: "技巧分享",
  },
];

export default function BlogPage() {
  return (
    <div className="pt-16 md:pt-20">
      {/* Featured Article */}
      <section>
        <Link href={`/blog/${articles[0].slug}`} className="block group">
          <div className="relative aspect-[21/9] md:aspect-[3/1] overflow-hidden">
            <Image
              src={articles[0].cover}
              alt={articles[0].title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105 cinematic-image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2a2a2a]/70 via-[#2a2a2a]/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
              <div className="max-w-7xl mx-auto">
                <span className="inline-block px-3 py-1 bg-[#5a8a87]/40 backdrop-blur-sm text-xs tracking-widest uppercase rounded-full mb-4 text-white">
                  {articles[0].category}
                </span>
                <h1 className="font-serif text-2xl md:text-4xl lg:text-5xl mb-3 group-hover:text-[#c9a77c] transition-colors duration-500">
                  {articles[0].title}
                </h1>
                <p className="text-stone-200 text-sm md:text-base max-w-2xl hidden md:block">
                  {articles[0].excerpt}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Articles Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {articles.slice(1).map((article) => (
            <article key={article.id} className="group">
              <Link href={`/blog/${article.slug}`} className="block">
                <div className="relative aspect-[16/10] overflow-hidden mb-4">
                  <Image
                    src={article.cover}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105 cinematic-image"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2a2a2a]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-400 mb-2">
                  <span className="px-2 py-0.5 bg-stone-100 rounded tracking-wider text-[#5a8a87]">{article.category}</span>
                  <span>{article.date}</span>
                </div>
                <h2 className="font-serif text-lg md:text-xl mb-2 text-stone-700 group-hover:text-[#5a8a87] transition-colors duration-500 line-clamp-2">
                  {article.title}
                </h2>
                <p className="text-stone-500 text-sm line-clamp-2">
                  {article.excerpt}
                </p>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
