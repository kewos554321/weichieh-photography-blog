"use client";

import Image from "next/image";
import { Images, Edit2, Trash2, Eye, EyeOff, Tag, FolderOpen } from "lucide-react";

interface Photo {
  id: number;
  slug: string;
  src: string;
  title: string;
}

interface AlbumCategory {
  id: number;
  name: string;
  slug: string;
}

interface AlbumTag {
  id: number;
  name: string;
}

interface Album {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  photoCount: number;
  previewPhotos: Photo[];
  category?: AlbumCategory | null;
  tags?: AlbumTag[];
  createdAt?: string;
}

interface AlbumCardProps {
  album: Album;
  isSelected?: boolean;
  showCheckbox?: boolean;
  onSelect?: (album: Album) => void;
  onEdit?: (album: Album) => void;
  onDelete?: (album: Album) => void;
}

export function AlbumCard({
  album,
  isSelected = false,
  showCheckbox = true,
  onSelect,
  onEdit,
  onDelete,
}: AlbumCardProps) {
  const coverImage = album.coverUrl || album.previewPhotos?.[0]?.src;

  return (
    <div
      className={`group relative bg-white rounded-lg border overflow-hidden transition-all hover:shadow-md ${
        isSelected ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-200"
      }`}
    >
      {/* Checkbox */}
      {showCheckbox && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(album)}
            className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500 bg-white/90"
          />
        </div>
      )}

      {/* Cover Image */}
      <div className="relative aspect-[4/3] bg-stone-100">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={album.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Images className="w-12 h-12 text-stone-300" />
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={() => onEdit(album)}
              className="p-2 bg-white rounded-full text-stone-700 hover:bg-stone-100 transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(album)}
              className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Visibility Badge */}
        <div className="absolute top-2 right-2">
          {album.isPublic ? (
            <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
              <Eye className="w-3 h-3" />
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 text-xs bg-stone-100 text-stone-600 rounded">
              <EyeOff className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Photo Count Badge */}
        <div className="absolute bottom-2 right-2">
          <span className="flex items-center gap-1 px-2 py-1 text-xs bg-black/60 text-white rounded">
            <Images className="w-3 h-3" />
            {album.photoCount}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-stone-900 truncate">{album.name}</h3>
        {album.description && (
          <p className="text-xs text-stone-500 truncate mt-0.5">{album.description}</p>
        )}

        {/* Category & Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {album.category && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
              <FolderOpen className="w-3 h-3" />
              {album.category.name}
            </span>
          )}
          {album.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-stone-100 text-stone-600 rounded"
            >
              <Tag className="w-3 h-3" />
              {tag.name}
            </span>
          ))}
          {album.tags && album.tags.length > 2 && (
            <span className="px-1.5 py-0.5 text-xs text-stone-400">
              +{album.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
