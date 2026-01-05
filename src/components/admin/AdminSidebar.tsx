"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Image as ImageIcon,
  FileText,
  ChevronLeft,
  Settings,
  Layers,
  User,
  List,
  Globe,
  BarChart3,
  FolderOpen,
  Images,
  MessageSquare,
} from "lucide-react";

type Section = "photos" | "albums" | "articles" | "media" | "comments" | "analytics" | "settings";

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
    subItems: [
      { label: "All Photos", href: "/admin/photos", icon: List },
      { label: "Taxonomy", href: "/admin/photos/taxonomy", icon: Layers },
    ],
  },
  {
    section: "albums",
    label: "Albums",
    icon: Images,
    href: "/admin/albums",
  },
  {
    section: "articles",
    label: "Blog",
    icon: FileText,
    href: "/admin/articles",
    subItems: [
      { label: "All Posts", href: "/admin/articles", icon: List },
      { label: "Taxonomy", href: "/admin/articles/taxonomy", icon: Layers },
    ],
  },
  {
    section: "media",
    label: "Media",
    icon: FolderOpen,
    href: "/admin/media",
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

  const getActiveSection = (): Section | null => {
    if (pathname.startsWith("/admin/photos")) return "photos";
    if (pathname.startsWith("/admin/albums")) return "albums";
    if (pathname.startsWith("/admin/articles")) return "articles";
    if (pathname.startsWith("/admin/media")) return "media";
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
    if (href === "/admin/photos" || href === "/admin/articles" || href === "/admin/settings") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-stone-900 text-white flex flex-col fixed h-full">
      {/* Logo */}
      <div className="p-4 border-b border-stone-700">
        <Link href="/" className="flex items-center gap-2 text-lg font-serif">
          <span>WeiChieh</span>
          <span className="text-stone-500 text-sm">Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
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
  );
}
