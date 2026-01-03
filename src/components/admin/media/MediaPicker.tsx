"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, X, FolderOpen } from "lucide-react";
import { MediaLibraryContent } from "./MediaLibraryContent";
import type { Media } from "../types";

interface MediaPickerProps {
  value?: string;
  onChange: (url: string, media?: Media) => void;
  placeholder?: string;
  className?: string;
}

export function MediaPicker({
  value,
  onChange,
  placeholder = "選擇或上傳圖片",
  className = "",
}: MediaPickerProps) {
  const [showLibrary, setShowLibrary] = useState(false);

  const handleSelect = (media: Media | Media[]) => {
    if (Array.isArray(media)) {
      // Multi-select not supported in picker mode
      return;
    }
    onChange(media.url, media);
    setShowLibrary(false);
  };

  const handleRemove = () => {
    onChange("", undefined);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        {value ? (
          // Preview selected image
          <div className="relative aspect-video rounded-lg overflow-hidden bg-stone-100 group">
            <Image
              src={value}
              alt="Selected"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setShowLibrary(true)}
                className="p-2 bg-white rounded-full text-stone-700 hover:bg-stone-100"
                title="變更"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                title="移除"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          // Empty state
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="w-full aspect-video rounded-lg border-2 border-dashed border-stone-200 hover:border-stone-300 flex flex-col items-center justify-center gap-2 text-stone-400 hover:text-stone-500 transition-colors"
          >
            <ImageIcon className="w-8 h-8" />
            <span className="text-sm">{placeholder}</span>
          </button>
        )}
      </div>

      {/* Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-medium text-stone-900">選擇媒體</h2>
              <button
                onClick={() => setShowLibrary(false)}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <MediaLibraryContent
                selectable
                multiSelect={false}
                onSelect={handleSelect}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
