"use client";

import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  id: number;
  name: string;
}

interface FolderBreadcrumbProps {
  path: BreadcrumbItem[];
  onNavigate: (folderId: number | null) => void;
}

export function FolderBreadcrumb({ path, onNavigate }: FolderBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-stone-600 bg-stone-50 px-3 py-2 rounded-lg">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 hover:text-stone-900 transition-colors p-1 rounded hover:bg-stone-200"
        title="Root"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Media</span>
      </button>

      {path.map((item, index) => (
        <div key={item.id} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-stone-400" />
          {index === path.length - 1 ? (
            <span className="font-medium text-stone-900 px-1">{item.name}</span>
          ) : (
            <button
              onClick={() => onNavigate(item.id)}
              className="hover:text-stone-900 transition-colors p-1 rounded hover:bg-stone-200"
            >
              {item.name}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}
