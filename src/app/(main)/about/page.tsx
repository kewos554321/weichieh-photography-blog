import Image from "next/image";
import Link from "next/link";
import { Mail, Instagram, MapPin, Camera } from "lucide-react";

export const metadata = {
  title: "About | WeiChieh Photography",
  description: "關於我的攝影故事與聯繫方式",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-24 pb-16">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 mb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Profile Image */}
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden film-grain">
            <Image
              src="/images/profile.jpg"
              alt="WeiChieh"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 vignette" />
          </div>

          {/* About Text */}
          <div className="space-y-6">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-stone-400 font-light mb-2">
                Photographer
              </p>
              <h1 className="font-serif text-4xl md:text-5xl text-stone-800 font-light tracking-wide">
                WeiChieh
              </h1>
            </div>

            <div className="space-y-4 text-stone-600 font-light leading-relaxed">
              <p>
                我是一位熱愛光影的攝影師，透過鏡頭捕捉生活中轉瞬即逝的美好瞬間。
              </p>
              <p>
                攝影對我來說，不只是記錄，更是一種與世界對話的方式。每一張照片都承載著當下的情感與故事，我希望能透過影像，讓觀者也能感受到那份獨特的溫度。
              </p>
              <p>
                特別鍾愛底片般的色調與自然光線，追求畫面中的寧靜與詩意。無論是人像、街拍還是風景，都希望能呈現出最真實、最動人的一面。
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4 border-t border-stone-200">
              <div>
                <p className="text-2xl font-serif text-stone-700">5+</p>
                <p className="text-xs text-stone-400 tracking-wider uppercase">Years</p>
              </div>
              <div>
                <p className="text-2xl font-serif text-stone-700">1000+</p>
                <p className="text-xs text-stone-400 tracking-wider uppercase">Photos</p>
              </div>
              <div>
                <p className="text-2xl font-serif text-stone-700">50+</p>
                <p className="text-xs text-stone-400 tracking-wider uppercase">Stories</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="bg-stone-100/50 py-16 mb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-stone-400 font-light mb-4">
            Philosophy
          </p>
          <blockquote className="font-serif text-2xl md:text-3xl text-stone-700 font-light leading-relaxed italic">
            &ldquo;每一張照片，都是一段時光的低語。&rdquo;
          </blockquote>
          <p className="mt-6 text-stone-500 font-light">
            我相信最好的照片來自於真實的情感連結，而非刻意的擺拍。
          </p>
        </div>
      </section>

      {/* Services & Equipment */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 mb-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Services */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Camera className="w-5 h-5 text-[#6b9e9a]" />
              <h2 className="font-serif text-xl text-stone-700">服務項目</h2>
            </div>
            <ul className="space-y-3 text-stone-600 font-light">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-[#6b9e9a] rounded-full" />
                人像攝影 / Portrait
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-[#6b9e9a] rounded-full" />
                活動紀錄 / Event
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-[#6b9e9a] rounded-full" />
                商業攝影 / Commercial
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-[#6b9e9a] rounded-full" />
                旅拍 / Travel Photography
              </li>
            </ul>
          </div>

          {/* Equipment */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Camera className="w-5 h-5 text-[#6b9e9a]" />
              <h2 className="font-serif text-xl text-stone-700">使用器材</h2>
            </div>
            <ul className="space-y-3 text-stone-600 font-light">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                Sony A7IV
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                Sony 85mm f/1.4 GM
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                Sony 35mm f/1.4 GM
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                Fujifilm X100V
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="bg-stone-900 rounded-2xl p-8 md:p-12 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-stone-500 font-light mb-2">
            Get In Touch
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-white font-light mb-4">
            聯繫我
          </h2>
          <p className="text-stone-400 font-light mb-8 max-w-md mx-auto">
            如果您有任何合作提案或攝影需求，歡迎透過以下方式與我聯繫。
          </p>

          {/* Contact Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="mailto:hello@weichieh.com"
              className="flex items-center gap-2 px-6 py-3 bg-white text-stone-900 rounded-full hover:bg-stone-100 transition-colors duration-300"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm font-light">hello@weichieh.com</span>
            </a>
            <a
              href="https://instagram.com/weichieh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 border border-stone-700 text-white rounded-full hover:border-stone-500 hover:bg-stone-800 transition-colors duration-300"
            >
              <Instagram className="w-4 h-4" />
              <span className="text-sm font-light">@weichieh</span>
            </a>
          </div>

          {/* Location */}
          <div className="flex items-center justify-center gap-2 text-stone-500">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-light">Based in Taipei, Taiwan</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 mt-16 text-center">
        <p className="text-stone-500 font-light mb-4">
          想看更多作品？
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 border border-stone-300 text-stone-700 rounded-full hover:border-stone-500 hover:bg-stone-50 transition-colors duration-500 text-sm tracking-wider uppercase font-light"
        >
          瀏覽作品集
        </Link>
      </section>
    </main>
  );
}
