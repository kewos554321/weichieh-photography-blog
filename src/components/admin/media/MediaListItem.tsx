"use client";

import Image from "next/image";
import { Edit2, Trash2, Check, Sliders, FolderOpen } from "lucide-react";
import type { Media } from "../types";

interface MediaListItemProps {
  media: Media;
  isSelected?: boolean;
  selectable?: boolean;
  showCheckbox?: boolean;
  compactMode?: boolean;
  onSelect?: (media: Media) => void;
  onEdit?: (media: Media) => void;
  onEditImage?: (media: Media) => void;
  onDelete?: (media: Media) => void;
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
  showCheckbox = false,
  compactMode = false,
  onSelect,
  onEdit,
  onEditImage,
  onDelete,
}: MediaListItemProps) {
  const handleRowClick = () => {
    if (selectable && onSelect) {
      onSelect(media);
    } else if (onEdit) {
      onEdit(media);
    }
  };

  return (
    <tr
      className={`hover:bg-stone-50 cursor-pointer ${isSelected ? "bg-stone-50" : ""}`}
      onClick={handleRowClick}
    >
      {/* Checkbox for bulk selection */}
      {showCheckbox && (
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(media)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
          />
        </td>
      )}

      {/* Thumbnail */}
      {!compactMode && (
        <td className="px-4 py-3">
          <div className="relative w-16 h-12 rounded overflow-hidden bg-stone-100">
            <Image
              src={media.url}
              alt={media.alt || media.filename}
              fill
              className="object-cover"
              sizes="64px"
            />
            {selectable && isSelected && (
              <div className="absolute inset-0 bg-stone-900/50 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </td>
      )}

      {/* Filename */}
      <td className="px-4 py-3">
        <div className="font-medium text-stone-900 max-w-xs truncate" title={media.filename}>
          {media.filename}
        </div>
        {media.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {media.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
              >
                {tag.name}
              </span>
            ))}
            {media.tags.length > 2 && (
              <span className="text-xs text-stone-400">+{media.tags.length - 2}</span>
            )}
          </div>
        )}
      </td>

      {/* Size */}
      <td className="px-4 py-3 text-sm text-stone-500">
        {formatFileSize(media.size)}
      </td>

      {/* Dimensions */}
      <td className="hidden md:table-cell px-4 py-3 text-sm text-stone-500">
        {media.width && media.height ? (
          <span>{media.width}×{media.height}</span>
        ) : (
          <span className="text-stone-400">-</span>
        )}
      </td>

      {/* Folder */}
      <td className="hidden lg:table-cell px-4 py-3">
        {media.folder ? (
          <span className="flex items-center gap-1 text-sm text-stone-500">
            <FolderOpen className="w-3 h-3" />
            {media.folder.name}
          </span>
        ) : (
          <span className="text-sm text-stone-400">-</span>
        )}
      </td>

      {/* Date */}
      <td className="hidden xl:table-cell px-4 py-3 text-sm text-stone-500">
        {formatDate(media.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(media);
              }}
              className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded"
              title="編輯資訊"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onEditImage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditImage(media);
              }}
              className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded"
              title="修圖"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(media);
              }}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
              title="刪除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
