"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, AlertTriangle, Loader2, ExternalLink, Image as ImageIcon, FileText } from "lucide-react";
import type { Media } from "../types";

interface UsageInfo {
  photos: Array<{ id: number; slug: string; title: string }>;
  articles: Array<{ id: number; slug: string; title: string }>;
}

interface MediaDeleteConfirmModalProps {
  media: Media;
  usage: UsageInfo;
  onClose: () => void;
  onConfirm: (force: boolean) => Promise<void>;
}

export function MediaDeleteConfirmModal({
  media,
  usage,
  onClose,
  onConfirm,
}: MediaDeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const hasUsage = usage.photos.length > 0 || usage.articles.length > 0;

  const handleForceDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">無法刪除此媒體</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Media Preview */}
          <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-lg">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
              <Image
                src={media.url}
                alt={media.filename}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-stone-900 truncate">{media.filename}</p>
              <p className="text-sm text-stone-500">
                {media.width && media.height && `${media.width}×${media.height} · `}
                {(media.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>

          {/* Warning Message */}
          <p className="text-stone-600">
            此媒體正在被以下內容使用，刪除後這些地方會出現破圖：
          </p>

          {/* Usage List */}
          {usage.photos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <ImageIcon className="w-4 h-4" />
                照片 ({usage.photos.length})
              </div>
              <ul className="space-y-1">
                {usage.photos.map((photo) => (
                  <li key={photo.id}>
                    <Link
                      href={`/admin/photos/${photo.id}`}
                      target="_blank"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg transition-colors group"
                    >
                      <span className="truncate flex-1">{photo.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {usage.articles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <FileText className="w-4 h-4" />
                文章 ({usage.articles.length})
              </div>
              <ul className="space-y-1">
                {usage.articles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`/admin/articles/${article.id}`}
                      target="_blank"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg transition-colors group"
                    >
                      <span className="truncate flex-1">{article.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>建議：</strong>先更換這些內容的圖片，再刪除此媒體。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 bg-stone-50">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleForceDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                刪除中...
              </>
            ) : (
              "仍要刪除"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
