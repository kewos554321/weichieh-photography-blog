import Link from "next/link";
import { Camera } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)]">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto rounded-full bg-[var(--card-border)]/50 flex items-center justify-center">
            <Camera className="w-16 h-16 text-[var(--text-muted)]" />
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-6xl font-serif text-[var(--accent-teal)]">
            404
          </span>
        </div>

        {/* Text */}
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)] mb-4">
          找不到頁面
        </h1>
        <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
          抱歉，您要找的頁面不存在或已被移動。<br />
          也許這張照片還在暗房沖洗中...
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-[var(--accent-teal)] text-white rounded-full text-sm tracking-wider hover:opacity-90 transition-opacity"
          >
            返回首頁
          </Link>
          <Link
            href="/blog"
            className="px-6 py-3 border border-[var(--card-border)] text-[var(--text-primary)] rounded-full text-sm tracking-wider hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)] transition-colors"
          >
            瀏覽文章
          </Link>
        </div>
      </div>
    </div>
  );
}
