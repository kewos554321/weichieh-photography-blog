import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const articles = [
  {
    id: 1,
    slug: "mountain-photography-tips",
    title: "山岳攝影的十個心得",
    date: "2024-12-15",
    cover: "https://picsum.photos/seed/blog1/1200/800",
    category: "技巧分享",
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

export function generateStaticParams() {
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  const currentIndex = articles.findIndex((a) => a.slug === article.slug);
  const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
  const nextArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;

  return (
    <div className="pt-16 md:pt-20">
      {/* Cover */}
      <div className="relative h-[40vh] md:h-[50vh]">
        <Image
          src={article.cover}
          alt={article.title}
          fill
          className="object-cover cinematic-image"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f7f5f2] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="flex items-center gap-3 text-xs tracking-widest uppercase text-stone-400 mb-4">
          <span className="text-[#5a8a87]">{article.category}</span>
          <span>·</span>
          <span>{article.date}</span>
        </div>

        <h1 className="font-serif text-3xl md:text-5xl mb-8 md:mb-12 text-stone-700">{article.title}</h1>

        <div className="prose prose-stone prose-lg max-w-none">
          {article.content.split("\n\n").map((paragraph, index) => {
            if (paragraph.startsWith("## ")) {
              return (
                <h2 key={index} className="font-serif text-xl md:text-2xl mt-10 md:mt-12 mb-4 md:mb-6 text-stone-600">
                  {paragraph.replace("## ", "")}
                </h2>
              );
            }
            return (
              <p key={index} className="text-stone-500 leading-relaxed mb-4 md:mb-6">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="py-8 md:py-12 mt-8 border-t border-stone-200">
          <div className="flex items-center justify-between">
            {prevArticle ? (
              <Link href={`/blog/${prevArticle.slug}`} className="group flex items-center gap-2 md:gap-3 text-stone-400 hover:text-[#5a8a87] transition-colors duration-500">
                <span className="text-xl md:text-2xl">←</span>
                <div className="hidden md:block">
                  <p className="text-xs text-stone-400 tracking-widest uppercase">上一篇</p>
                  <p className="font-serif text-stone-600 group-hover:text-[#5a8a87] transition-colors duration-500">{prevArticle.title}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            <Link href="/blog" className="text-xs tracking-widest uppercase text-stone-400 hover:text-[#5a8a87] transition-colors duration-500">
              All Articles
            </Link>

            {nextArticle ? (
              <Link href={`/blog/${nextArticle.slug}`} className="group flex items-center gap-2 md:gap-3 text-stone-400 hover:text-[#5a8a87] transition-colors duration-500 text-right">
                <div className="hidden md:block">
                  <p className="text-xs text-stone-400 tracking-widest uppercase">下一篇</p>
                  <p className="font-serif text-stone-600 group-hover:text-[#5a8a87] transition-colors duration-500">{nextArticle.title}</p>
                </div>
                <span className="text-xl md:text-2xl">→</span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
