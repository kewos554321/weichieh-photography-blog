"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Images, Eye, EyeOff, Loader2 } from "lucide-react";
import { AlbumModal } from "./AlbumModal";

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
  photoCount: number;
  previewPhotos: Photo[];
}

export function AlbumListContent() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchAlbums = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/albums?admin=true");
      const data = await res.json();
      setAlbums(data || []);
    } catch (error) {
      console.error("Failed to fetch albums:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const handleEdit = async (album: Album) => {
    // Fetch full album details with photos
    try {
      const res = await fetch(`/api/albums/${album.slug}?admin=true`);
      const fullAlbum = await res.json();
      setEditingAlbum(fullAlbum);
      setShowModal(true);
    } catch (error) {
      console.error("Failed to fetch album:", error);
    }
  };

  const handleDelete = async (album: Album) => {
    if (!confirm(`確定要刪除「${album.name}」相簿嗎？`)) return;

    try {
      const res = await fetch(`/api/albums/${album.slug}`, { method: "DELETE" });
      if (res.ok) {
        setAlbums(albums.filter((a) => a.id !== album.id));
      } else {
        const data = await res.json();
        alert(data.error || "刪除失敗");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("刪除失敗");
    }
  };

  const handleSuccess = () => {
    setShowModal(false);
    setEditingAlbum(null);
    fetchAlbums();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Albums</h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage photo collections
          </p>
        </div>
        <button
          onClick={() => {
            setEditingAlbum(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Album
        </button>
      </div>

      {/* Albums Grid */}
      {albums.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <Images className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg">No albums yet</p>
          <p className="text-sm mt-1">Create your first album to organize photos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-white rounded-lg border border-stone-200 overflow-hidden group hover:shadow-md transition-shadow"
            >
              {/* Cover */}
              <div className="relative aspect-video bg-stone-100">
                {album.coverUrl || album.previewPhotos[0] ? (
                  <Image
                    src={album.coverUrl || album.previewPhotos[0].src}
                    alt={album.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Images className="w-12 h-12 text-stone-300" />
                  </div>
                )}
                {/* Visibility Badge */}
                <div
                  className={`absolute top-2 left-2 px-2 py-1 rounded text-xs flex items-center gap-1 ${
                    album.isPublic
                      ? "bg-green-100 text-green-700"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {album.isPublic ? (
                    <>
                      <Eye className="w-3 h-3" />
                      Public
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3" />
                      Private
                    </>
                  )}
                </div>
                {/* Photo Count */}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white rounded text-xs flex items-center gap-1">
                  <Images className="w-3 h-3" />
                  {album.photoCount}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-medium text-stone-900 mb-1">{album.name}</h3>
                {album.description && (
                  <p className="text-sm text-stone-500 line-clamp-2 mb-3">
                    {album.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => handleEdit(album)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(album)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AlbumModal
          album={editingAlbum}
          onClose={() => {
            setShowModal(false);
            setEditingAlbum(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
