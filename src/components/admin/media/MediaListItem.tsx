"use client";

import Image from "next/image";
import { Edit2, Trash2, Check, Eye, FolderOpen } from "lucide-react";
import type { Media } from "../types";

interface MediaListItemProps {
  media: Media;
  isSelected?: boolean;
  selectable?: boolean;
  onSelect?: (media: Media) => void;
  onEdit?: (media: Media) => void;
  onDelete?: (media: Media) => void;
  onView?: (media: Media) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function MediaListItem({
  media,
  isSelected = false,
  selectable = false,
  onSelect,
  onEdit,
  onDelete,
  onView,
}: MediaListItemProps) {
  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(media);
    } else if (onView) {
      onView(media);
    }
  };

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2 bg-white rounded-lg border transition-all duration-200 cursor-pointer ${
        isSelected
          ? "border-stone-900 ring-2 ring-stone-900/20"
          : "border-stone-100 hover:border-stone-300 hover:shadow-sm"
      }`}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-stone-100">
        <Image
          src={media.url}
          alt={media.alt || media.filename}
          fill
          className="object-cover"
          sizes="48px"
        />
        {selectable && isSelected && (
          <div className="absolute inset-0 bg-stone-900/50 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Filename */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-900 truncate" title={media.filename}>
          {media.filename}
        </p>
        {media.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {media.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded"
              >
                {tag.name}
              </span>
            ))}
            {media.tags.length > 2 && (
              <span className="text-[10px] text-stone-400">+{media.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* Size */}
      <div className="w-20 text-right flex-shrink-0">
        <span className="text-sm text-stone-500">{formatFileSize(media.size)}</span>
      </div>

      {/* Dimensions */}
      <div className="hidden md:block w-28 text-right flex-shrink-0">
        {media.width && media.height ? (
          <span className="text-sm text-stone-500">
            {media.width}×{media.height}
          </span>
        ) : (
          <span className="text-sm text-stone-400">-</span>
        )}
      </div>

      {/* Folder */}
      <div className="hidden lg:flex items-center gap-1 w-20 flex-shrink-0">
        {media.folder ? (
          <>
            <FolderOpen className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
            <span className="text-sm text-stone-500 truncate">{media.folder.name}</span>
          </>
        ) : (
          <span className="text-sm text-stone-400">未分類</span>
        )}
      </div>

      {/* Date */}
      <div className="hidden xl:block w-24 flex-shrink-0">
        <span className="text-sm text-stone-500">{formatDate(media.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 w-24 justify-end flex-shrink-0">
        {onView && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(media);
            }}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
            title="查看"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(media);
            }}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
            title="編輯"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(media);
            }}
            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="刪除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
