"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  FileText,
  ChevronLeft,
  Settings,
  User,
  Globe,
  BarChart3,
  FolderOpen,
  Images,
  MessageSquare,
  Key,
  Tag,
  Menu,
  X,
} from "lucide-react";

type Section = "photos" | "albums" | "posts" | "media" | "categories-tags" | "tokens" | "comments" | "analytics" | "settings";

interface SubNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavItem {
  section: Section;
  label: string;
  icon: React.ElementType;
  href: string;
  subItems?: SubNavItem[];
}

const navItems: NavItem[] = [
  {
    section: "photos",
    label: "Photos",
    icon: ImageIcon,
    href: "/admin/photos",
  },
  {
    section: "albums",
    label: "Albums",
    icon: Images,
    href: "/admin/albums",
  },
  {
    section: "posts",
    label: "Posts",
    icon: FileText,
    href: "/admin/posts",
  },
  {
    section: "media",
    label: "Media",
    icon: FolderOpen,
    href: "/admin/media",
  },
  {
    section: "categories-tags",
    label: "Categories & Tags",
    icon: Tag,
    href: "/admin/categories-tags",
  },
  {
    section: "tokens",
    label: "Access Tokens",
    icon: Key,
    href: "/admin/tokens",
  },
  {
    section: "comments",
    label: "Comments",
    icon: MessageSquare,
    href: "/admin/comments",
  },
  {
    section: "analytics",
    label: "Analytics",
    icon: BarChart3,
    href: "/admin/analytics",
  },
  {
    section: "settings",
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
    subItems: [
      { label: "Profile", href: "/admin/settings", icon: User },
      { label: "SEO & Analytics", href: "/admin/settings/seo", icon: Globe },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const getActiveSection = (): Section | null => {
    if (pathname.startsWith("/admin/photos")) return "photos";
    if (pathname.startsWith("/admin/albums")) return "albums";
    if (pathname.startsWith("/admin/posts")) return "posts";
    if (pathname.startsWith("/admin/media")) return "media";
    if (pathname.startsWith("/admin/categories-tags")) return "categories-tags";
    if (pathname.startsWith("/admin/tokens")) return "tokens";
    if (pathname.startsWith("/admin/comments")) return "comments";
    if (pathname.startsWith("/admin/analytics")) return "analytics";
    if (pathname.startsWith("/admin/settings")) return "settings";
    return null;
  };

  const activeSection = getActiveSection();

  const isSubItemActive = (href: string) => {
    // 完全匹配，或者是子路徑
    if (pathname === href) return true;
    // 特殊處理：如果是列表頁面，只有完全匹配才算
    if (href === "/admin/photos" || href === "/admin/posts" || href === "/admin/media" || href === "/admin/settings") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-stone-900 flex items-center px-4">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -ml-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="ml-3 text-white font-serif">WeiChieh <span className="text-stone-500 text-sm">Admin</span></span>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-stone-900 text-white flex flex-col fixed h-full z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo + Close Button */}
        <div className="p-4 border-b border-stone-700 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-serif">
            <span>WeiChieh</span>
            <span className="text-stone-500 text-sm">Admin</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 text-stone-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.section;
            const isSettings = item.section === "settings";

            return (
              <div key={item.section} className={isSettings ? "pt-4 mt-4 border-t border-stone-700" : ""}>
                <Link
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-stone-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
                {isActive && item.subItems && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                            isSubItemActive(subItem.href)
                              ? "bg-white/10 text-white"
                              : "text-stone-500 hover:text-stone-300"
                          }`}
                        >
                          <SubIcon className="w-4 h-4" />
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-stone-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Site
          </Link>
        </div>
      </aside>
    </>
  );
}
