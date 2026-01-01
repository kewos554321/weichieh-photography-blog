"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/" || pathname.startsWith("/photo");
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#f7f5f2]/90 backdrop-blur-md border-b border-stone-200/50">
      <nav className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl md:text-2xl tracking-wider text-stone-700">
          WeiChieh
        </Link>
        <div className="flex gap-4 md:gap-8 text-sm tracking-widest uppercase text-stone-400">
          <Link
            href="/"
            className={isActive("/") ? "text-[#5a8a87]" : "hover:text-[#5a8a87] transition-colors duration-500"}
          >
            Photos
          </Link>
          <Link
            href="/blog"
            className={isActive("/blog") ? "text-[#5a8a87]" : "hover:text-[#5a8a87] transition-colors duration-500"}
          >
            Blog
          </Link>
          <Link
            href="/about"
            className={`hidden md:block ${isActive("/about") ? "text-[#5a8a87]" : "hover:text-[#5a8a87] transition-colors duration-500"}`}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`hidden md:block ${isActive("/contact") ? "text-[#5a8a87]" : "hover:text-[#5a8a87] transition-colors duration-500"}`}
          >
            Contact
          </Link>
        </div>
      </nav>
    </header>
  );
}
