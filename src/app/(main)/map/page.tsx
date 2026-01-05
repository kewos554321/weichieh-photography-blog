"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Maximize2, X, Search, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/skeletons/Skeleton";

// Dynamically import map component to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// Component to control map view programmatically
const MapController = dynamic(
  () => Promise.all([
    import("react-leaflet"),
    import("react")
  ]).then(([mod, ReactMod]) => {
    const { useMap } = mod;
    return function MapControllerComponent({ center, zoom }: { center: [number, number] | null; zoom: number }) {
      const map = useMap();
      ReactMod.useEffect(() => {
        if (center) {
          map.setView(center, zoom);
        }
      }, [map, center, zoom]);
      return null;
    };
  }),
  { ssr: false }
) as React.ComponentType<{ center: [number, number] | null; zoom: number }>;

interface Photo {
  id: number;
  slug: string;
  title: string;
  src: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  category: string;
  date: string;
}

export default function MapPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get unique categories from photos
  const categories = ["all", ...Array.from(new Set(photos.map(p => p.category).filter(Boolean)))];

  // Filter photos by category
  const filteredPhotos = selectedCategory === "all"
    ? photos
    : photos.filter(p => p.category === selectedCategory);

  // Handle location search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: { "User-Agent": "WeiChieh-Photography-Blog" },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setSearchCenter([lat, lng]);
      } else {
        setSearchError("找不到此地點");
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setSearchError("搜尋逾時");
      } else {
        setSearchError("搜尋失敗");
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handle keyboard events for fullscreen
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && isFullscreen) {
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Fix Leaflet default icon issue
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setIsMapReady(true);
    });

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch("/api/photos?limit=500");
        const data = await res.json();
        // Filter photos that have coordinates
        const photosWithCoords = (data.photos || []).filter(
          (p: Photo) => p.latitude !== null && p.longitude !== null
        );
        setPhotos(photosWithCoords);
      } catch (error) {
        console.error("Failed to fetch photos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  // Calculate map center based on photos
  const getMapCenter = (): [number, number] => {
    if (photos.length === 0) {
      return [25.033, 121.565]; // Default: Taipei
    }
    const avgLat = photos.reduce((sum, p) => sum + (p.latitude || 0), 0) / photos.length;
    const avgLng = photos.reduce((sum, p) => sum + (p.longitude || 0), 0) / photos.length;
    return [avgLat, avgLng];
  };

  if (isLoading || !isMapReady) {
    return (
      <div className="pt-16 md:pt-20 min-h-screen">
        {/* Header Skeleton */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <Skeleton className="h-4 w-20 mb-3" />
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-4 w-96" />
        </div>
        {/* Map Skeleton */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 mb-8">
          <Skeleton className="h-[45vh] md:h-[50vh] rounded-lg" />
        </div>
        {/* Photo Grid Skeleton */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-square rounded-lg mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 md:pt-20 min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent-teal)] mb-3">
          Explore
        </p>
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[var(--foreground)] mb-4">
          Photography Map
        </h1>
        <p className="text-[var(--text-secondary)] max-w-2xl">
          探索我在世界各地拍攝的照片。點擊地圖上的標記查看該地點的作品。
        </p>
      </div>

      {/* Map Container */}
      <div className="relative h-[45vh] md:h-[50vh] max-w-7xl mx-auto px-4 md:px-6 mb-8">
        <div className="relative h-full rounded-lg overflow-hidden shadow-lg">
        {/* Soft overlay for cartoon effect */}
        <style jsx global>{`
          .leaflet-tile {
            filter: saturate(0.7) brightness(1.08) contrast(0.85) sepia(0.1);
          }
          .leaflet-container {
            background: #f5f3ef;
            font-family: inherit;
          }
          .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 0;
            overflow: hidden;
          }
          .leaflet-popup-content {
            margin: 0 !important;
            width: 220px !important;
          }
          .leaflet-popup-tip {
            background: white;
          }
          .custom-marker {
            background: #6b9e9a;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
        `}</style>

        <MapContainer
          center={getMapCenter()}
          zoom={photos.length > 0 ? 5 : 3}
          className="h-full w-full z-0"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {photos.map((photo) => (
            <Marker
              key={photo.id}
              position={[photo.latitude!, photo.longitude!]}
              eventHandlers={{
                click: () => setSelectedPhoto(photo),
              }}
            >
              <Popup>
                <div>
                  <div className="relative w-full h-[140px] overflow-hidden">
                    <Image
                      src={photo.src}
                      alt={photo.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-[#6b9e9a] uppercase tracking-wider mb-1">
                      {photo.category}
                    </p>
                    <h3 className="font-serif text-stone-800 text-base mb-1">
                      {photo.title}
                    </h3>
                    <p className="text-xs text-stone-500 mb-2">
                      {photo.location}
                    </p>
                    <Link
                      href={`/photo/${photo.slug}`}
                      className="inline-block text-xs text-[#6b9e9a] hover:underline"
                    >
                      View Photo →
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Photo count badge */}
        <div className="absolute top-4 right-4 z-[1000] bg-[var(--card-bg)]/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
          <span className="text-sm text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--accent-teal)]">{photos.length}</span> photos on map
          </span>
        </div>

        {/* Fullscreen button */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute bottom-4 right-4 z-[1000] bg-[var(--card-bg)]/90 backdrop-blur-sm p-2.5 rounded-full shadow-sm hover:bg-[var(--card-bg)] transition-colors group"
          aria-label="View fullscreen map"
        >
          <Maximize2 className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-teal)] transition-colors" />
        </button>
        </div>
      </div>

      {/* Fullscreen Map Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[1100] bg-black/95 flex flex-col">
          {/* Top bar - all controls in one row */}
          <div className="flex items-center gap-3 p-3 shrink-0 bg-black/50 backdrop-blur-sm">
            {/* Photo count */}
            <div className="px-3 py-1.5 bg-white/10 rounded-full text-white/80 text-sm whitespace-nowrap">
              <span className="font-medium">{filteredPhotos.length}</span> photos
            </div>

            {/* Category Filter */}
            <div className="flex gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-[#6b9e9a] text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Location Search */}
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="搜尋地點..."
                  className="w-40 md:w-56 pl-9 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  disabled={isSearching}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "搜尋"}
              </button>
              {searchError && (
                <span className="text-xs text-red-400 hidden md:inline">{searchError}</span>
              )}
            </div>

            {/* Close button */}
            <button
              className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-colors ml-2"
              onClick={() => setIsFullscreen(false)}
              aria-label="Close fullscreen"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Fullscreen Map */}
          <div className="flex-1 relative min-h-0">
            <style jsx global>{`
              .fullscreen-map .leaflet-tile {
                filter: saturate(0.7) brightness(1.08) contrast(0.85) sepia(0.1);
              }
              .fullscreen-map .leaflet-container {
                background: #1a1a1a;
              }
            `}</style>
            <MapContainer
              center={getMapCenter()}
              zoom={photos.length > 0 ? 5 : 3}
              className="h-full w-full fullscreen-map"
              scrollWheelZoom={true}
            >
              <MapController center={searchCenter} zoom={12} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredPhotos.map((photo) => (
                <Marker
                  key={photo.id}
                  position={[photo.latitude!, photo.longitude!]}
                  eventHandlers={{
                    click: () => setSelectedPhoto(photo),
                  }}
                >
                  <Popup>
                    <div>
                      <div className="relative w-full h-[140px] overflow-hidden">
                        <Image
                          src={photo.src}
                          alt={photo.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-[#6b9e9a] uppercase tracking-wider mb-1">
                          {photo.category}
                        </p>
                        <h3 className="font-serif text-stone-800 text-base mb-1">
                          {photo.title}
                        </h3>
                        <p className="text-xs text-stone-500 mb-2">
                          {photo.location}
                        </p>
                        <Link
                          href={`/photo/${photo.slug}`}
                          className="inline-block text-xs text-[#6b9e9a] hover:underline"
                        >
                          View Photo →
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Bottom bar - keyboard hints */}
          <div className="shrink-0 p-4 border-t border-white/10">
            <div className="max-w-4xl mx-auto flex items-center justify-center">
              <div className="hidden md:flex text-white/50 text-xs items-center gap-4">
                <span className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-white/10 rounded">Esc</kbd>
                  <span>Close</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">No photos with location yet</h3>
          <p className="text-[var(--text-secondary)]">
            Add coordinates to your photos in the admin panel to see them on the map.
          </p>
        </div>
      )}

      {/* Photo list by location */}
      {photos.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h2 className="font-serif text-2xl text-[var(--text-primary)] mb-8">Photos by Location</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.slice(0, 10).map((photo) => (
              <Link
                key={photo.id}
                href={`/photo/${photo.slug}`}
                className="group block"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
                  <Image
                    src={photo.src}
                    alt={photo.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm text-[var(--text-primary)] truncate group-hover:text-[var(--accent-teal)] transition-colors">
                  {photo.title}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">{photo.location}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
