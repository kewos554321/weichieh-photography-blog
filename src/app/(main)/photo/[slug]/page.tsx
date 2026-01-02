"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter, notFound } from "next/navigation";

const photos = [
  {
    id: 1,
    slug: "silent-gaze",
    src: "https://picsum.photos/seed/pw1/1200/900",
    category: "Portrait",
    title: "Silent Gaze",
    date: "2024-12-01",
    location: "Taipei",
    camera: "Sony A7IV",
    lens: "85mm f/1.4",
    story: "在台北的巷弄間，我遇見了這位老人。他的眼神中藏著無數故事，彷彿在訴說著一生的經歷。那天的陽光從屋簷間灑落，為這一刻增添了一份溫暖。",
    behindTheScene: "這張照片是在一個尋常的下午拍攝的。我正走在迪化街的老巷弄裡，偶然看見這位老人獨自坐在門口。他的神情專注而平靜，彷彿在回憶著什麼。我輕聲詢問是否可以為他拍張照，他微微點頭，眼神依舊望向遠方。"
  },
  {
    id: 2,
    slug: "mountain-dawn",
    src: "https://picsum.photos/seed/pw2/1200/900",
    category: "Landscape",
    title: "Mountain Dawn",
    date: "2024-11-15",
    location: "Alishan",
    camera: "Sony A7IV",
    lens: "16-35mm f/2.8",
    story: "凌晨四點起床，只為捕捉阿里山的日出。當第一道光線穿透雲海，整個世界都被染成了金色。那一刻的寧靜，讓人忘記了所有的疲憊。",
    behindTheScene: "為了這張照片，我在山上露營了兩天。第一天天氣不好，雲層太厚看不到日出。第二天終於等到了完美的條件，金色的陽光穿透雲海的那一刻，我知道所有的等待都值得了。"
  },
  {
    id: 3,
    slug: "urban-rhythm",
    src: "https://picsum.photos/seed/pw3/1200/900",
    category: "Street",
    title: "Urban Rhythm",
    date: "2024-11-20",
    location: "Tokyo",
    camera: "Leica Q3",
    lens: "28mm f/1.7",
    story: "東京的街頭永遠充滿活力。在澀谷的十字路口，數百人同時穿越，卻又各自孤獨。這種矛盾的美感，正是都市生活的縮影。",
    behindTheScene: "我在澀谷站前的星巴克二樓待了一整個下午，觀察人群的流動。每次綠燈亮起，人潮湧動的節奏都略有不同。這張照片捕捉到了我認為最完美的一刻。"
  },
  {
    id: 4,
    slug: "the-artist",
    src: "https://picsum.photos/seed/pw4/1200/900",
    category: "Portrait",
    title: "The Artist",
    date: "2024-10-28",
    location: "Tainan",
    camera: "Sony A7IV",
    lens: "35mm f/1.4",
    story: "她是一位傳統工藝師，專注於手工製作已有四十年。看著她專注的神情，我感受到了匠人精神的真諦。",
    behindTheScene: "這是一次計畫性的拍攝。我事先聯繫了這位師傅，花了半天時間了解她的工作流程。真正開始拍攝時，她已經完全忘記鏡頭的存在，專注於手中的作品。"
  },
  {
    id: 5,
    slug: "forest-whisper",
    src: "https://picsum.photos/seed/pw5/1200/900",
    category: "Nature",
    title: "Forest Whisper",
    date: "2024-10-15",
    location: "Taroko",
    camera: "Sony A7IV",
    lens: "24-70mm f/2.8",
    story: "太魯閣的森林深處，陽光透過樹葉灑落，形成一道道光束。在這裡，時間似乎靜止了，只剩下風吹過樹葉的聲音。",
    behindTheScene: "這是一條少有人知的小徑，需要徒步約兩小時才能到達。當天早晨有薄霧，陽光穿透霧氣形成了這些美麗的光束。我在這裡待了將近一小時，等待最完美的光線角度。"
  },
  {
    id: 6,
    slug: "night-market",
    src: "https://picsum.photos/seed/pw6/1200/900",
    category: "Street",
    title: "Night Market",
    date: "2024-09-30",
    location: "Kaohsiung",
    camera: "Fujifilm X-T5",
    lens: "23mm f/1.4",
    story: "夜市的煙火氣息，是台灣最真實的生活寫照。攤販的叫賣聲、食物的香氣、人群的喧囂，構成了一幅熱鬧的庶民畫卷。",
    behindTheScene: "我喜歡用底片的色調來呈現夜市的氛圍。這張照片使用了 Fujifilm 的 Classic Chrome 色彩模式，讓畫面帶有一種復古的溫暖感。"
  },
  {
    id: 7,
    slug: "ocean-blue",
    src: "https://picsum.photos/seed/pw7/1200/900",
    category: "Landscape",
    title: "Ocean Blue",
    date: "2024-09-15",
    location: "Kenting",
    camera: "Sony A7IV",
    lens: "16-35mm f/2.8",
    story: "墾丁的海，有著說不盡的藍。站在海邊，看著浪花一波波湧來，心中的煩惱也隨之消散。",
    behindTheScene: "這是一個需要耐心等待的拍攝。我使用了減光鏡拍攝長曝光，讓海浪呈現出絲綢般的質感。前後嘗試了不同的曝光時間，最後選擇了這張 30 秒曝光的版本。"
  },
  {
    id: 8,
    slug: "childhood",
    src: "https://picsum.photos/seed/pw8/1200/900",
    category: "Portrait",
    title: "Childhood",
    date: "2024-08-20",
    location: "Yilan",
    camera: "Leica Q3",
    lens: "28mm f/1.7",
    story: "孩子的笑容是最純真的。在宜蘭的稻田邊，這個小女孩正在追逐蝴蝶，那份無憂無慮的快樂，讓人羨慕。",
    behindTheScene: "這是一個偶然的瞬間。我正在拍攝稻田風景，這個小女孩突然跑進了畫面。她的純真笑容感染了我，我立刻轉換焦點，捕捉了這個珍貴的時刻。"
  },
  {
    id: 9,
    slug: "misty-morning",
    src: "https://picsum.photos/seed/pw9/1200/900",
    category: "Nature",
    title: "Misty Morning",
    date: "2024-08-10",
    location: "Sun Moon Lake",
    camera: "Sony A7IV",
    lens: "70-200mm f/2.8",
    story: "日月潭的清晨，薄霧籠罩著湖面。划著小船穿過霧氣，彷彿進入了另一個世界。這種朦朧的美，只有親身經歷才能體會。",
    behindTheScene: "凌晨五點租了一艘小船出發。當時能見度不到五十公尺，我幾乎是憑感覺在拍攝。當太陽開始升起，霧氣漸漸散開的那一刻，整個畫面美得令人窒息。"
  },
  {
    id: 10,
    slug: "temple-fair",
    src: "https://picsum.photos/seed/pw10/1200/900",
    category: "Street",
    title: "Temple Fair",
    date: "2024-07-25",
    location: "Lukang",
    camera: "Fujifilm X-T5",
    lens: "16mm f/1.4",
    story: "鹿港的廟會熱鬧非凡。神轎出巡、鞭炮聲響，傳統信仰在這裡代代相傳，成為台灣文化最重要的一部分。",
    behindTheScene: "廟會的拍攝充滿挑戰，人群擁擠、光線複雜。我選擇使用廣角鏡頭，盡可能靠近主體，讓觀者有身歷其境的感覺。"
  },
  {
    id: 11,
    slug: "golden-fields",
    src: "https://picsum.photos/seed/pw11/1200/900",
    category: "Landscape",
    title: "Golden Fields",
    date: "2024-07-10",
    location: "Chishang",
    camera: "Sony A7IV",
    lens: "24-70mm f/2.8",
    story: "池上的稻田在收割前最美。金黃色的稻浪隨風搖曳，伯朗大道上的遊客紛紛停下腳步，被這片景色所震撼。",
    behindTheScene: "這張照片拍攝於收割前一週。我特地避開遊客最多的時段，選擇在日出後的第一個小時拍攝，此時的光線最為柔和，稻穗的金色也最為飽滿。"
  },
  {
    id: 12,
    slug: "reflection",
    src: "https://picsum.photos/seed/pw12/1200/900",
    category: "Portrait",
    title: "Reflection",
    date: "2024-06-20",
    location: "Taipei",
    camera: "Leica Q3",
    lens: "28mm f/1.7",
    story: "在咖啡廳的窗邊，她若有所思地望著窗外。玻璃上映出她的倒影，虛實之間，彷彿在訴說著內心的故事。",
    behindTheScene: "這是一個計畫性的人像拍攝。我選擇了這間有大片落地窗的咖啡廳，利用自然光和玻璃反射創造出這種虛實交錯的效果。"
  },
  {
    id: 13,
    slug: "waterfall",
    src: "https://picsum.photos/seed/pw13/1200/900",
    category: "Nature",
    title: "Waterfall",
    date: "2024-06-05",
    location: "Shifen",
    camera: "Sony A7IV",
    lens: "16-35mm f/2.8",
    story: "十分瀑布的壯觀，讓人心曠神怡。水花飛濺，彩虹若隱若現，大自然的鬼斧神工在此展露無遺。",
    behindTheScene: "為了拍到彩虹，我選擇在正午時分前往。使用了防水袋保護相機，因為瀑布的水氣非常大。最後成功在水霧中捕捉到了這道美麗的彩虹。"
  },
  {
    id: 14,
    slug: "old-town",
    src: "https://picsum.photos/seed/pw14/1200/900",
    category: "Street",
    title: "Old Town",
    date: "2024-05-18",
    location: "Jiufen",
    camera: "Fujifilm X-T5",
    lens: "35mm f/1.4",
    story: "九份的老街承載著太多記憶。紅燈籠、石階梯、茶樓，每一個角落都訴說著過去的繁華。",
    behindTheScene: "避開假日的人潮，選擇在平日傍晚前往。當紅燈籠亮起，遊客漸漸散去，九份才展現出它最真實的一面。"
  },
  {
    id: 15,
    slug: "sunset",
    src: "https://picsum.photos/seed/pw15/1200/900",
    category: "Landscape",
    title: "Sunset",
    date: "2024-05-01",
    location: "Gaomei Wetland",
    camera: "Sony A7IV",
    lens: "24-70mm f/2.8",
    story: "高美濕地的夕陽，是台灣最美的風景之一。天空被染成橙紅色，倒映在濕地上，形成一幅天然的畫作。",
    behindTheScene: "這是我第三次來高美濕地，前兩次都因為天氣不好而沒有拍到理想的畫面。這次終於遇到了完美的條件，天空中的雲層為夕陽增添了豐富的層次。"
  },
  {
    id: 16,
    slug: "wisdom",
    src: "https://picsum.photos/seed/pw16/1200/900",
    category: "Portrait",
    title: "Wisdom",
    date: "2024-04-15",
    location: "Tainan",
    camera: "Leica Q3",
    lens: "28mm f/1.7",
    story: "這位老先生在廟前下棋已有數十年。他說，人生如棋，每一步都要深思熟慮。他的話語中，藏著歲月的智慧。",
    behindTheScene: "我在廟前觀察了很久才鼓起勇氣上前攀談。老先生非常健談，我們聊了將近一個小時。這張照片是在他專注思考下一步棋的時候拍攝的。"
  },
];

export default function PhotoPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showImageHint, setShowImageHint] = useState(false);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const photo = slug ? photos.find((p) => p.slug === slug) : null;
  const currentIndex = photo ? photos.findIndex((p) => p.slug === photo.slug) : -1;
  const prevPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" && prevPhoto) {
      router.push(`/photo/${prevPhoto.slug}`);
    } else if (e.key === "ArrowRight" && nextPhoto) {
      router.push(`/photo/${nextPhoto.slug}`);
    } else if (e.key === "Escape") {
      router.push("/");
    }
  }, [prevPhoto, nextPhoto, router]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!slug) return null;

  if (!photo) {
    notFound();
  }

  // Get related photos (same category, excluding current)
  const relatedPhotos = photos
    .filter((p) => p.category === photo.category && p.slug !== photo.slug)
    .slice(0, 4);

  return (
    <div className="pt-16 md:pt-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <nav className="flex items-center gap-2 text-xs tracking-wider text-stone-400">
          <Link href="/" className="hover:text-[#6b9e9a] transition-colors">
            Gallery
          </Link>
          <span>/</span>
          <span className="text-[#6b9e9a]">{photo.category}</span>
          <span>/</span>
          <span className="text-stone-600">{photo.title}</span>
        </nav>
      </div>

      {/* Keyboard Hint */}
      <div className="hidden md:block fixed bottom-6 right-6 z-50">
        <div className="flex items-center gap-2 text-xs text-stone-400 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
          <kbd className="px-2 py-0.5 bg-stone-100 rounded text-stone-500">←</kbd>
          <kbd className="px-2 py-0.5 bg-stone-100 rounded text-stone-500">→</kbd>
          <span>Navigate</span>
          <span className="text-stone-300 mx-1">|</span>
          <kbd className="px-2 py-0.5 bg-stone-100 rounded text-stone-500">Esc</kbd>
          <span>Gallery</span>
        </div>
      </div>

      {/* Hero Section - Image Left, Info Right */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-12 md:pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Image */}
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-sm group cursor-zoom-in"
            onMouseEnter={() => setShowImageHint(true)}
            onMouseLeave={() => setShowImageHint(false)}
          >
            <Image
              src={photo.src}
              alt={photo.title}
              fill
              className={`object-cover transition-all duration-700 ${isImageLoaded ? "opacity-100" : "opacity-0"} group-hover:scale-[1.02]`}
              priority
              onLoad={() => setIsImageLoaded(true)}
            />
            {/* Image loading skeleton */}
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-stone-200 animate-pulse" />
            )}
            {/* Hover hint */}
            <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 ${showImageHint ? "opacity-100" : "opacity-0"}`}>
              <div className="flex items-center gap-2 text-white text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                <span>View Full Size</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="lg:py-4">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs tracking-[0.2em] uppercase text-stone-400 mb-6">
              <span className="px-3 py-1 bg-[#6b9e9a]/10 text-[#6b9e9a] rounded-full">
                {photo.category}
              </span>
              <span>{photo.location}</span>
              <span>·</span>
              <span>{photo.date}</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-stone-800 mb-6 md:mb-8">
              {photo.title}
            </h1>

            {/* Story */}
            <p className="text-stone-600 leading-relaxed mb-8 text-lg">
              {photo.story}
            </p>

            {/* Technical Info */}
            <div className="grid grid-cols-2 gap-6 py-6 border-t border-b border-stone-200 mb-8">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1">Camera</p>
                <p className="text-sm text-stone-700 font-medium">{photo.camera}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1">Lens</p>
                <p className="text-sm text-stone-700 font-medium">{photo.lens}</p>
              </div>
            </div>

            {/* Share Buttons */}
            <div>
              <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">Share this photo</p>
              <div className="flex gap-3">
                <button className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Behind The Scene */}
      <section className="border-t border-stone-200 bg-stone-50/50">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <p className="text-xs tracking-[0.3em] uppercase text-[#6b9e9a] mb-4">Behind The Scene</p>
          <h2 className="font-serif text-2xl md:text-3xl text-stone-800 mb-8">拍攝故事</h2>
          <p className="text-stone-600 leading-loose text-lg">
            {photo.behindTheScene}
          </p>
        </div>
      </section>

      {/* Related Photos */}
      {relatedPhotos.length > 0 && (
        <section className="border-t border-stone-200 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-xs tracking-widest uppercase text-stone-400 mb-2">More {photo.category}</p>
                <h2 className="font-serif text-2xl md:text-3xl text-stone-700">Related Photos</h2>
              </div>
              <Link
                href="/"
                className="text-sm text-stone-500 hover:text-[#6b9e9a] transition-colors flex items-center gap-2"
              >
                View All <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedPhotos.map((related) => (
                <Link key={related.slug} href={`/photo/${related.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-sm mb-3">
                    <Image
                      src={related.src}
                      alt={related.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <p className="font-serif text-stone-700 group-hover:text-[#6b9e9a] transition-colors">
                    {related.title}
                  </p>
                  <p className="text-xs text-stone-400">{related.location}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Navigation */}
      <section className="border-t border-stone-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3">
            {/* Previous */}
            {prevPhoto ? (
              <Link
                href={`/photo/${prevPhoto.slug}`}
                className="group flex items-center gap-4 p-6 md:p-10 hover:bg-stone-50 transition-colors duration-300"
              >
                <span className="text-2xl text-stone-300 group-hover:text-[#6b9e9a] transition-colors">←</span>
                <div className="hidden md:block">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1">Previous</p>
                  <p className="font-serif text-stone-700 group-hover:text-[#6b9e9a] transition-colors">{prevPhoto.title}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {/* Back to Gallery */}
            <Link
              href="/"
              className="flex items-center justify-center p-6 md:p-10 border-x border-stone-200 hover:bg-stone-50 transition-colors duration-300"
            >
              <span className="text-xs tracking-[0.2em] uppercase text-stone-500 hover:text-[#6b9e9a] transition-colors">
                Back to Gallery
              </span>
            </Link>

            {/* Next */}
            {nextPhoto ? (
              <Link
                href={`/photo/${nextPhoto.slug}`}
                className="group flex items-center justify-end gap-4 p-6 md:p-10 hover:bg-stone-50 transition-colors duration-300"
              >
                <div className="hidden md:block text-right">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1">Next</p>
                  <p className="font-serif text-stone-700 group-hover:text-[#6b9e9a] transition-colors">{nextPhoto.title}</p>
                </div>
                <span className="text-2xl text-stone-300 group-hover:text-[#6b9e9a] transition-colors">→</span>
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
