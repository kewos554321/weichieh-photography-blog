"use client";

import { Folder, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface FolderCardProps {
  folder: {
    id: number;
    name: string;
    _count?: {
      media: number;
      children: number;
    };
  };
  isSelected?: boolean;
  showCheckbox?: boolean;
  onOpen: (folderId: number) => void;
  onSelect?: (folderId: number) => void;
  onRename?: (folder: { id: number; name: string }) => void;
  onDelete?: (folderId: number) => void;
}

export function FolderCard({
  folder,
  isSelected = false,
  showCheckbox = false,
  onOpen,
  onSelect,
  onRename,
  onDelete,
}: FolderCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mediaCount = folder._count?.media || 0;
  const childrenCount = folder._count?.children || 0;

  return (
    <div
      className={`group relative bg-white rounded-lg border-2 p-4 hover:shadow-sm transition-all cursor-pointer ${
        isSelected
          ? "border-stone-900 ring-2 ring-stone-900/20"
          : "border-stone-200 hover:border-stone-300"
      }`}
      onClick={() => onOpen(folder.id)}
    >
      {/* Checkbox */}
      {showCheckbox && (
        <div
          className={`absolute top-2 left-2 z-10 transition-opacity ${
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(folder.id)}
            className="w-5 h-5 rounded border-stone-300 bg-white text-stone-900 focus:ring-stone-500 cursor-pointer"
          />
        </div>
      )}

      {/* Menu Button */}
      <div className="absolute top-2 right-2 z-10" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded text-stone-400 hover:text-stone-600 hover:bg-stone-100 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-20">
            {onRename && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onRename(folder);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Rename
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete(folder.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Folder Icon */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-14 flex items-center justify-center">
          <Folder className="w-14 h-12 text-amber-400 fill-amber-100" />
        </div>
        <div className="text-center w-full">
          <p className="text-sm font-medium text-stone-900 truncate" title={folder.name}>
            {folder.name}
          </p>
          <p className="text-xs text-stone-500">
            {childrenCount > 0 && `${childrenCount} folders`}
            {childrenCount > 0 && mediaCount > 0 && ", "}
            {mediaCount > 0 && `${mediaCount} files`}
            {childrenCount === 0 && mediaCount === 0 && "Empty"}
          </p>
        </div>
      </div>
    </div>
  );
}
