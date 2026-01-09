"use client";

import Image from "next/image";
import { Edit2, Trash2, Check, Sliders, Image as ImageIcon, FileText } from "lucide-react";
import type { Media } from "../types";

interface MediaCardProps {
  media: Media;
  isSelected?: boolean;
  selectable?: boolean;
  showCheckbox?: boolean;
  onSelect?: (media: Media, shiftKey?: boolean) => void;
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

export function MediaCard({
  media,
  isSelected = false,
  selectable = false,
  showCheckbox = false,
  onSelect,
  onEdit,
  onEditImage,
  onDelete,
}: MediaCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (selectable && onSelect) {
      onSelect(media, e.shiftKey);
    } else if (onEdit) {
      onEdit(media);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(media, e.shiftKey);
    }
  };

  return (
    <div
      className={`group relative bg-white rounded-lg overflow-hidden shadow-sm border-2 transition-all duration-300 cursor-pointer ${
        isSelected
          ? "border-stone-900 ring-2 ring-stone-900/20"
          : "border-transparent hover:border-stone-300"
      }`}
      onClick={handleClick}
    >
      {/* Image */}
      <div className="aspect-square relative bg-stone-100">
        <Image
          src={media.url}
          alt={media.alt || media.filename}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
        />

        {/* Selection Indicator / Checkbox */}
        {showCheckbox && (
          <div
            className={`absolute top-2 left-2 transition-opacity ${
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            onClick={handleCheckboxClick}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              className="w-5 h-5 rounded border-stone-300 bg-white text-stone-900 focus:ring-stone-500 cursor-pointer"
            />
          </div>
        )}
        {selectable && isSelected && !showCheckbox && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-stone-900 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Usage badges */}
        {media._usage && (media._usage.photoCount > 0 || media._usage.postCount > 0) && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {media._usage.photoCount > 0 && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-emerald-500 text-white rounded shadow-sm"
                title={`${media._usage.photoCount} 張照片使用中`}
              >
                <ImageIcon className="w-3 h-3" />
                {media._usage.photoCount}
              </span>
            )}
            {media._usage.postCount > 0 && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-violet-500 text-white rounded shadow-sm"
                title={`${media._usage.postCount} 篇文章使用中`}
              >
                <FileText className="w-3 h-3" />
                {media._usage.postCount}
              </span>
            )}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(media);
              }}
              className="p-2 bg-white rounded-full text-stone-700 hover:bg-stone-100 transition-colors"
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
              className="p-2 bg-white rounded-full text-stone-700 hover:bg-stone-100 transition-colors"
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
              className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
              title="刪除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs text-stone-700 truncate" title={media.filename}>
          {media.filename}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-stone-400">
            {formatFileSize(media.size)}
          </span>
          {media.width && media.height && (
            <span className="text-xs text-stone-400">
              {media.width}×{media.height}
            </span>
          )}
        </div>
        {media.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {media.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded"
              >
                {tag.name}
              </span>
            ))}
            {media.tags.length > 2 && (
              <span className="text-xs text-stone-400">
                +{media.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
