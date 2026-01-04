"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

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
      <div className="pt-16 md:pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 md:pt-20 min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <p className="text-xs tracking-[0.3em] uppercase text-[#6b9e9a] mb-3">
          Explore
        </p>
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-stone-800 mb-4">
          Photography Map
        </h1>
        <p className="text-stone-500 max-w-2xl">
          探索我在世界各地拍攝的照片。點擊地圖上的標記查看該地點的作品。
        </p>
      </div>

      {/* Map Container */}
      <div className="relative h-[60vh] md:h-[70vh] mx-4 md:mx-6 mb-8 rounded-lg overflow-hidden shadow-lg">
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
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
          <span className="text-sm text-stone-600">
            <span className="font-medium text-[#6b9e9a]">{photos.length}</span> photos on map
          </span>
        </div>
      </div>

      {/* Empty state */}
      {photos.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-stone-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-serif text-xl text-stone-700 mb-2">No photos with location yet</h3>
          <p className="text-stone-500">
            Add coordinates to your photos in the admin panel to see them on the map.
          </p>
        </div>
      )}

      {/* Photo list by location */}
      {photos.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h2 className="font-serif text-2xl text-stone-700 mb-8">Photos by Location</h2>
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
                <p className="text-sm text-stone-700 truncate group-hover:text-[#6b9e9a] transition-colors">
                  {photo.title}
                </p>
                <p className="text-xs text-stone-400 truncate">{photo.location}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
