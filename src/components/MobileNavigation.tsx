"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, BookOpen, MapPin, FolderOpen } from "lucide-react";

const navItems = [
  { href: "/", icon: Camera, label: "Photos" },
  { href: "/albums", icon: FolderOpen, label: "Albums" },
  { href: "/blog", icon: BookOpen, label: "Blog" },
  { href: "/map", icon: MapPin, label: "Map" },
];

export function MobileNavigation() {
  const pathname = usePathname();

  // Don't show on admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--card-bg)]/95 backdrop-blur-md border-t border-[var(--card-border)] safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors ${
                isActive
                  ? "text-[var(--accent-teal)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
