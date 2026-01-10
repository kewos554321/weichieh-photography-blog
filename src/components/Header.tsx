"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DarkModeToggle } from "./DarkModeToggle";

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/" || pathname.startsWith("/photo");
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 md:h-16 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--card-border)]/50 transition-colors duration-300">
      <nav className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        <Link href="/" className="font-serif text-xl md:text-2xl tracking-[0.15em] text-[var(--text-primary)] font-light">
          WeiChieh
        </Link>
        <div className="flex items-center gap-4 md:gap-8">
          {/* Navigation links - hidden on mobile, shown on desktop */}
          <div className="hidden md:flex gap-8 text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] font-light">
            <Link
              href="/"
              className={isActive("/") ? "text-[var(--accent-teal)]" : "hover:text-[var(--accent-teal)] transition-colors duration-500"}
            >
              Photos
            </Link>
            <Link
              href="/blog"
              className={isActive("/blog") ? "text-[var(--accent-teal)]" : "hover:text-[var(--accent-teal)] transition-colors duration-500"}
            >
              Blog
            </Link>
            <Link
              href="/map"
              className={isActive("/map") ? "text-[var(--accent-teal)]" : "hover:text-[var(--accent-teal)] transition-colors duration-500"}
            >
              Map
            </Link>
            <Link
              href="/about"
              className={isActive("/about") ? "text-[var(--accent-teal)]" : "hover:text-[var(--accent-teal)] transition-colors duration-500"}
            >
              About
            </Link>
          </div>
          <DarkModeToggle />
        </div>
      </nav>
    </header>
  );
}
