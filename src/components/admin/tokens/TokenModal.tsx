"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Loader2, Check, Calendar } from "lucide-react";

interface AccessToken {
  id: string;
  name: string;
  token: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    photos: number;
    albums: number;
  };
}

interface Photo {
  id: number;
  slug: string;
  src: string;
  title: string;
  visibility: string;
}

interface Album {
  id: number;
  slug: string;
  name: string;
  coverUrl: string | null;
  visibility: string;
  photoCount?: number;
}

interface TokenModalProps {
  token: AccessToken | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface TokenPermissions {
  photoIds: number[];
  albumIds: number[];
}

export function TokenModal({ token, onClose, onSuccess }: TokenModalProps) {
  const isEditing = !!token;

  const [formData, setFormData] = useState({
    name: token?.name || "",
    expiresAt: token?.expiresAt ? token.expiresAt.split("T")[0] : "",
  });

  const [permissions, setPermissions] = useState<TokenPermissions>({
    photoIds: [],
    albumIds: [],
  });

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "photos" | "albums">("settings");

  // Fetch photos and albums
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [photosRes, albumsRes] = await Promise.all([
          fetch("/api/photos?admin=true&limit=1000"),
          fetch("/api/albums?admin=true"),
        ]);

        const photosData = await photosRes.json();
        const albumsData = await albumsRes.json();

        // Only show private items (public items are visible to everyone)
        setPhotos((photosData.photos || []).filter((p: Photo) => p.visibility === "private"));
        setAlbums((albumsData || []).filter((a: Album) => a.visibility === "private"));

        // If editing, fetch current permissions
        if (token) {
          const tokenRes = await fetch(`/api/admin/tokens/${token.id}`);
          const tokenData = await tokenRes.json();
          setPermissions({
            photoIds: tokenData.photos?.map((p: { photoId: number }) => p.photoId) || [],
            albumIds: tokenData.albums?.map((a: { albumId: number }) => a.albumId) || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("請輸入 Token 名稱");
      return;
    }

    setIsSaving(true);

    try {
      let tokenId = token?.id;

      // Create or update token
      if (isEditing) {
        const res = await fetch(`/api/admin/tokens/${token.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            expiresAt: formData.expiresAt || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "更新失敗");
        }
      } else {
        const res = await fetch("/api/admin/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            expiresAt: formData.expiresAt || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "建立失敗");
        }

        const newToken = await res.json();
        tokenId = newToken.id;
      }

      // Update permissions
      const permRes = await fetch(`/api/admin/tokens/${tokenId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permissions),
      });

      if (!permRes.ok) {
        const data = await permRes.json();
        throw new Error(data.error || "權限更新失敗");
      }

      onSuccess();
    } catch (error) {
      console.error("Save failed:", error);
      alert(error instanceof Error ? error.message : "儲存失敗");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePhoto = (photoId: number) => {
    setPermissions((prev) => ({
      ...prev,
      photoIds: prev.photoIds.includes(photoId)
        ? prev.photoIds.filter((id) => id !== photoId)
        : [...prev.photoIds, photoId],
    }));
  };

  const toggleAlbum = (albumId: number) => {
    setPermissions((prev) => ({
      ...prev,
      albumIds: prev.albumIds.includes(albumId)
        ? prev.albumIds.filter((id) => id !== albumId)
        : [...prev.albumIds, albumId],
    }));
  };

  const selectAllPhotos = () => {
    setPermissions((prev) => ({
      ...prev,
      photoIds: photos.map((p) => p.id),
    }));
  };

  const deselectAllPhotos = () => {
    setPermissions((prev) => ({
      ...prev,
      photoIds: [],
    }));
  };

  const selectAllAlbums = () => {
    setPermissions((prev) => ({
      ...prev,
      albumIds: albums.map((a) => a.id),
    }));
  };

  const deselectAllAlbums = () => {
    setPermissions((prev) => ({
      ...prev,
      albumIds: [],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900">
            {isEditing ? "Edit Token" : "New Token"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "settings"
                ? "text-stone-900 border-b-2 border-stone-900"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab("photos")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "photos"
                ? "text-stone-900 border-b-2 border-stone-900"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Photos ({permissions.photoIds.length})
          </button>
          <button
            onClick={() => setActiveTab("albums")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "albums"
                ? "text-stone-900 border-b-2 border-stone-900"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Albums ({permissions.albumIds.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
          ) : (
            <>
              {/* Settings Tab */}
              {activeTab === "settings" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Token Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., Close Friends, Family"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-stone-500">
                      A descriptive name for this access group
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Expiration Date (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.expiresAt}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      Leave empty for no expiration
                    </p>
                  </div>

                  {isEditing && token && (
                    <div className="pt-4 border-t border-stone-200">
                      <p className="text-sm text-stone-500">
                        Token:{" "}
                        <code className="font-mono text-xs bg-stone-100 px-2 py-1 rounded">
                          {token.token}
                        </code>
                      </p>
                      <p className="text-sm text-stone-500 mt-2">
                        Share link: {window.location.origin}/private?token={token.token}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Photos Tab */}
              {activeTab === "photos" && (
                <div>
                  {photos.length === 0 ? (
                    <div className="text-center py-12 text-stone-400">
                      <p>No private photos available</p>
                      <p className="text-sm mt-1">
                        Set photos to &quot;Private&quot; visibility to add them here
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-stone-600">
                          Select photos this token can access
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={selectAllPhotos}
                            className="text-xs text-stone-600 hover:text-stone-900"
                          >
                            Select All
                          </button>
                          <span className="text-stone-300">|</span>
                          <button
                            onClick={deselectAllPhotos}
                            className="text-xs text-stone-600 hover:text-stone-900"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {photos.map((photo) => (
                          <button
                            key={photo.id}
                            onClick={() => togglePhoto(photo.id)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                              permissions.photoIds.includes(photo.id)
                                ? "border-stone-900 ring-2 ring-stone-900/20"
                                : "border-transparent hover:border-stone-300"
                            }`}
                          >
                            <Image
                              src={photo.src}
                              alt={photo.title}
                              fill
                              className="object-cover"
                            />
                            {permissions.photoIds.includes(photo.id) && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-stone-900 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <p className="text-xs text-white truncate">{photo.title}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Albums Tab */}
              {activeTab === "albums" && (
                <div>
                  {albums.length === 0 ? (
                    <div className="text-center py-12 text-stone-400">
                      <p>No private albums available</p>
                      <p className="text-sm mt-1">
                        Set albums to &quot;Private&quot; visibility to add them here
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-stone-600">
                          Select albums this token can access
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={selectAllAlbums}
                            className="text-xs text-stone-600 hover:text-stone-900"
                          >
                            Select All
                          </button>
                          <span className="text-stone-300">|</span>
                          <button
                            onClick={deselectAllAlbums}
                            className="text-xs text-stone-600 hover:text-stone-900"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {albums.map((album) => (
                          <button
                            key={album.id}
                            onClick={() => toggleAlbum(album.id)}
                            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                              permissions.albumIds.includes(album.id)
                                ? "border-stone-900 ring-2 ring-stone-900/20"
                                : "border-transparent hover:border-stone-300"
                            }`}
                          >
                            {album.coverUrl ? (
                              <Image
                                src={album.coverUrl}
                                alt={album.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-stone-200 flex items-center justify-center">
                                <span className="text-stone-400">No Cover</span>
                              </div>
                            )}
                            {permissions.albumIds.includes(album.id) && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-stone-900 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                              <p className="text-sm text-white font-medium">{album.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 bg-stone-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Token"}
          </button>
        </div>
      </div>
    </div>
  );
}
