import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const photos = [
  { id: 1, slug: "silent-gaze", src: "https://picsum.photos/seed/pw1/1200/1600", category: "Portrait", title: "Silent Gaze", date: "2024-12-01", location: "Taipei", story: "在台北的巷弄間，我遇見了這位老人。他的眼神中藏著無數故事，彷彿在訴說著一生的經歷。那天的陽光從屋簷間灑落，為這一刻增添了一份溫暖。" },
  { id: 2, slug: "mountain-dawn", src: "https://picsum.photos/seed/pw2/1200/800", category: "Landscape", title: "Mountain Dawn", date: "2024-11-15", location: "Alishan", story: "凌晨四點起床，只為捕捉阿里山的日出。當第一道光線穿透雲海，整個世界都被染成了金色。那一刻的寧靜，讓人忘記了所有的疲憊。" },
  { id: 3, slug: "urban-rhythm", src: "https://picsum.photos/seed/pw3/1200/1200", category: "Street", title: "Urban Rhythm", date: "2024-11-20", location: "Tokyo", story: "東京的街頭永遠充滿活力。在澀谷的十字路口，數百人同時穿越，卻又各自孤獨。這種矛盾的美感，正是都市生活的縮影。" },
  { id: 4, slug: "the-artist", src: "https://picsum.photos/seed/pw4/1200/900", category: "Portrait", title: "The Artist", date: "2024-10-28", location: "Tainan", story: "她是一位傳統工藝師，專注於手工製作已有四十年。看著她專注的神情，我感受到了匠人精神的真諦。" },
  { id: 5, slug: "forest-whisper", src: "https://picsum.photos/seed/pw5/1200/1500", category: "Nature", title: "Forest Whisper", date: "2024-10-15", location: "Taroko", story: "太魯閣的森林深處，陽光透過樹葉灑落，形成一道道光束。在這裡，時間似乎靜止了，只剩下風吹過樹葉的聲音。" },
  { id: 6, slug: "night-market", src: "https://picsum.photos/seed/pw6/1200/1000", category: "Street", title: "Night Market", date: "2024-09-30", location: "Kaohsiung", story: "夜市的煙火氣息，是台灣最真實的生活寫照。攤販的叫賣聲、食物的香氣、人群的喧囂，構成了一幅熱鬧的庶民畫卷。" },
  { id: 7, slug: "ocean-blue", src: "https://picsum.photos/seed/pw7/1200/1400", category: "Landscape", title: "Ocean Blue", date: "2024-09-15", location: "Kenting", story: "墾丁的海，有著說不盡的藍。站在海邊，看著浪花一波波湧來，心中的煩惱也隨之消散。" },
  { id: 8, slug: "childhood", src: "https://picsum.photos/seed/pw8/1200/800", category: "Portrait", title: "Childhood", date: "2024-08-20", location: "Yilan", story: "孩子的笑容是最純真的。在宜蘭的稻田邊，這個小女孩正在追逐蝴蝶，那份無憂無慮的快樂，讓人羨慕。" },
  { id: 9, slug: "misty-morning", src: "https://picsum.photos/seed/pw9/1200/1700", category: "Nature", title: "Misty Morning", date: "2024-08-10", location: "Sun Moon Lake", story: "日月潭的清晨，薄霧籠罩著湖面。划著小船穿過霧氣，彷彿進入了另一個世界。這種朦朧的美，只有親身經歷才能體會。" },
  { id: 10, slug: "temple-fair", src: "https://picsum.photos/seed/pw10/1200/1100", category: "Street", title: "Temple Fair", date: "2024-07-25", location: "Lukang", story: "鹿港的廟會熱鬧非凡。神轎出巡、鞭炮聲響，傳統信仰在這裡代代相傳，成為台灣文化最重要的一部分。" },
  { id: 11, slug: "golden-fields", src: "https://picsum.photos/seed/pw11/1200/800", category: "Landscape", title: "Golden Fields", date: "2024-07-10", location: "Chishang", story: "池上的稻田在收割前最美。金黃色的稻浪隨風搖曳，伯朗大道上的遊客紛紛停下腳步，被這片景色所震撼。" },
  { id: 12, slug: "reflection", src: "https://picsum.photos/seed/pw12/1200/1500", category: "Portrait", title: "Reflection", date: "2024-06-20", location: "Taipei", story: "在咖啡廳的窗邊，她若有所思地望著窗外。玻璃上映出她的倒影，虛實之間，彷彿在訴說著內心的故事。" },
  { id: 13, slug: "waterfall", src: "https://picsum.photos/seed/pw13/1200/1000", category: "Nature", title: "Waterfall", date: "2024-06-05", location: "Shifen", story: "十分瀑布的壯觀，讓人心曠神怡。水花飛濺，彩虹若隱若現，大自然的鬼斧神工在此展露無遺。" },
  { id: 14, slug: "old-town", src: "https://picsum.photos/seed/pw14/1200/1300", category: "Street", title: "Old Town", date: "2024-05-18", location: "Jiufen", story: "九份的老街承載著太多記憶。紅燈籠、石階梯、茶樓，每一個角落都訴說著過去的繁華。" },
  { id: 15, slug: "sunset", src: "https://picsum.photos/seed/pw15/1200/800", category: "Landscape", title: "Sunset", date: "2024-05-01", location: "Gaomei Wetland", story: "高美濕地的夕陽，是台灣最美的風景之一。天空被染成橙紅色，倒映在濕地上，形成一幅天然的畫作。" },
  { id: 16, slug: "wisdom", src: "https://picsum.photos/seed/pw16/1200/1600", category: "Portrait", title: "Wisdom", date: "2024-04-15", location: "Tainan", story: "這位老先生在廟前下棋已有數十年。他說，人生如棋，每一步都要深思熟慮。他的話語中，藏著歲月的智慧。" },
];

export function generateStaticParams() {
  return photos.map((photo) => ({
    slug: photo.slug,
  }));
}

export default async function PhotoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const photo = photos.find((p) => p.slug === slug);

  if (!photo) {
    notFound();
  }

  const currentIndex = photos.findIndex((p) => p.slug === photo.slug);
  const prevPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null;

  return (
    <div className="pt-16 md:pt-20">
      <article className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Photo */}
        <div className="relative w-full flex justify-center py-4 md:py-8">
          <Image
            src={photo.src}
            alt={photo.title}
            width={1200}
            height={1600}
            className="max-h-[60vh] md:max-h-[70vh] w-auto object-contain cinematic-image"
            priority
          />
        </div>

        {/* Story */}
        <div className="max-w-2xl mx-auto py-8 md:py-12">
          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs tracking-widest uppercase text-stone-400 mb-4">
            <span>{photo.category}</span>
            <span className="text-[#5a8a87]">·</span>
            <span>{photo.location}</span>
            <span className="text-[#5a8a87]">·</span>
            <span>{photo.date}</span>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl mb-6 md:mb-8 text-stone-700">{photo.title}</h1>

          <p className="text-base md:text-lg leading-relaxed text-stone-500">
            {photo.story}
          </p>
        </div>

        {/* Navigation */}
        <div className="max-w-2xl mx-auto py-8 md:py-12 border-t border-stone-200">
          <div className="flex items-center justify-between">
            {prevPhoto ? (
              <Link href={`/photo/${prevPhoto.slug}`} className="group flex items-center gap-2 md:gap-3 text-stone-400 hover:text-[#5a8a87] transition-colors duration-500">
                <span className="text-xl md:text-2xl">←</span>
                <div className="hidden md:block">
                  <p className="text-xs text-stone-400 tracking-widest uppercase">Previous</p>
                  <p className="font-serif text-stone-600 group-hover:text-[#5a8a87] transition-colors duration-500">{prevPhoto.title}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            <Link href="/" className="text-xs tracking-widest uppercase text-stone-400 hover:text-[#5a8a87] transition-colors duration-500">
              All Photos
            </Link>

            {nextPhoto ? (
              <Link href={`/photo/${nextPhoto.slug}`} className="group flex items-center gap-2 md:gap-3 text-stone-400 hover:text-[#5a8a87] transition-colors duration-500 text-right">
                <div className="hidden md:block">
                  <p className="text-xs text-stone-400 tracking-widest uppercase">Next</p>
                  <p className="font-serif text-stone-600 group-hover:text-[#5a8a87] transition-colors duration-500">{nextPhoto.title}</p>
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
