"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { X, Loader2, Images, Plus, Trash2, Wand2 } from "lucide-react";

interface Photo {
  id: number;
  slug: string;
  src: string;
  title: string;
}

interface Album {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  photos?: Photo[];
}

interface AlbumModalProps {
  album: Album | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AlbumModal({ album, onClose, onSuccess }: AlbumModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePhotos, setAvailablePhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);

  const [formData, setFormData] = useState({
    name: album?.name || "",
    slug: album?.slug || "",
    description: album?.description || "",
    coverUrl: album?.coverUrl || "",
    isPublic: album?.isPublic !== false,
  });

  const [albumPhotos, setAlbumPhotos] = useState<Photo[]>(album?.photos || []);

  const isEditMode = !!album;

  // Load available photos
  useEffect(() => {
    fetch("/api/photos?admin=true&limit=100")
      .then((res) => res.json())
      .then((data) => setAvailablePhotos(data.photos || []))
      .catch(() => setAvailablePhotos([]));
  }, []);

  // Initialize selected photos from album
  useEffect(() => {
    if (album?.photos) {
      setSelectedPhotos(new Set(album.photos.map((p) => p.id)));
      setAlbumPhotos(album.photos);
    }
  }, [album]);

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormData({ ...formData, name, slug: isEditMode ? formData.slug : slug });
  };

  const handleGenerateSlug = async () => {
    if (!formData.name.trim()) return;

    setIsGeneratingSlug(true);
    try {
      const response = await fetch("/api/ai/generate-slug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.name,
          type: "album",
          excludeSlug: isEditMode ? album?.slug : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate slug");

      const data = await response.json();
      if (data.slug) {
        setFormData((prev) => ({ ...prev, slug: data.slug }));
      }
    } catch (err) {
      console.error("Generate slug error:", err);
    } finally {
      setIsGeneratingSlug(false);
    }
  };

  const handleAddPhotos = async () => {
    if (selectedPhotos.size === 0) {
      setShowPhotoSelector(false);
      return;
    }

    // Get newly selected photos
    const currentPhotoIds = new Set(albumPhotos.map((p) => p.id));
    const newPhotoIds = [...selectedPhotos].filter((id) => !currentPhotoIds.has(id));
    const newPhotos = availablePhotos.filter((p) => newPhotoIds.includes(p.id));

    setAlbumPhotos([...albumPhotos, ...newPhotos]);
    setShowPhotoSelector(false);
  };

  const handleRemovePhoto = (photoId: number) => {
    setAlbumPhotos(albumPhotos.filter((p) => p.id !== photoId));
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      newSet.delete(photoId);
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create or update album
      const url = isEditMode ? `/api/albums/${album.slug}` : "/api/albums";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          coverUrl: formData.coverUrl || albumPhotos[0]?.src || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save album");
      }

      const savedAlbum = await response.json();

      // Update photos in album
      const photoIds = albumPhotos.map((p) => p.id);

      if (isEditMode) {
        // Remove all and re-add
        const currentPhotoIds = album.photos?.map((p) => p.id) || [];
        const removedIds = currentPhotoIds.filter((id) => !photoIds.includes(id));
        const addedIds = photoIds.filter((id) => !currentPhotoIds.includes(id));

        if (removedIds.length > 0) {
          await fetch(`/api/albums/${savedAlbum.slug}/photos`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoIds: removedIds }),
          });
        }

        if (addedIds.length > 0) {
          await fetch(`/api/albums/${savedAlbum.slug}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoIds: addedIds }),
          });
        }
      } else if (photoIds.length > 0) {
        await fetch(`/api/albums/${savedAlbum.slug}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoIds }),
        });
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Images className="w-5 h-5" />
            {isEditMode ? "Edit Album" : "Create Album"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Slug
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-md bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500"
                  required
                />
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  disabled={isGeneratingSlug || !formData.name.trim()}
                  className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="AI 產生 Slug"
                >
                  {isGeneratingSlug ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Cover Image URL (optional)
            </label>
            <input
              type="text"
              value={formData.coverUrl}
              onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
              placeholder="Leave empty to use first photo"
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isPublic" className="text-sm text-stone-700">
              Public album (visible to visitors)
            </label>
          </div>

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-stone-700">
                Photos ({albumPhotos.length})
              </label>
              <button
                type="button"
                onClick={() => setShowPhotoSelector(true)}
                className="text-sm text-stone-600 hover:text-stone-900 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Photos
              </button>
            </div>

            {albumPhotos.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-stone-50 rounded-lg">
                {albumPhotos.map((photo) => (
                  <div key={photo.id} className="relative group aspect-square">
                    <Image
                      src={photo.src}
                      alt={photo.title}
                      fill
                      className="object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-lg">
                <Images className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No photos added yet</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors disabled:bg-stone-400"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Album"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Photo Selector Modal */}
      {showPhotoSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium">Select Photos</h3>
              <button
                onClick={() => setShowPhotoSelector(false)}
                className="p-1 hover:bg-stone-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {availablePhotos.map((photo) => {
                  const isSelected = selectedPhotos.has(photo.id);
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => {
                        setSelectedPhotos((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(photo.id)) {
                            newSet.delete(photo.id);
                          } else {
                            newSet.add(photo.id);
                          }
                          return newSet;
                        });
                      }}
                      className={`relative aspect-square rounded overflow-hidden border-2 transition-colors ${
                        isSelected ? "border-blue-500" : "border-transparent"
                      }`}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.title}
                        fill
                        className="object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border-t bg-stone-50">
              <span className="text-sm text-stone-500">
                {selectedPhotos.size} photos selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPhotoSelector(false)}
                  className="px-4 py-2 text-stone-700 hover:bg-stone-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddPhotos}
                  className="px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800"
                >
                  Add Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
