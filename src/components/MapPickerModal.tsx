"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, MapPin, Loader2 } from "lucide-react";

interface MapPickerModalProps {
  latitude: number | null;
  longitude: number | null;
  onSelect: (lat: number, lng: number) => void;
  onClose: () => void;
}

export default function MapPickerModal({
  latitude,
  longitude,
  onSelect,
  onClose,
}: MapPickerModalProps) {
  const [isMapReady, setIsMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const defaultCenter: [number, number] = latitude && longitude
    ? [latitude, longitude]
    : [25.033, 121.565]; // Default: Taipei

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      // Dynamically import Leaflet
      const L = await import("leaflet");

      // Load CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
        // Wait for CSS to load
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Fix default icon
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapContainerRef.current || !isMounted) return;

      // Check if map already exists and clean it up
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Create map
      const map = L.map(mapContainerRef.current).setView(defaultCenter, latitude && longitude ? 12 : 5);
      mapInstanceRef.current = map;

      // Add tile layer with soft style
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Add initial marker if coords exist
      if (latitude && longitude) {
        markerRef.current = L.marker([latitude, longitude]).addTo(map);
      }

      // Handle click
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setTempCoords({ lat, lng });

        // Update marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else if (mapInstanceRef.current) {
          markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
        }
      });

      setIsMapReady(true);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: { "User-Agent": "WeiChieh-Photography-Blog" },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data[0] && mapInstanceRef.current) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setTempCoords({ lat, lng });
        mapInstanceRef.current.setView([lat, lng], 12);

        // Update marker
        const L = await import("leaflet");
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
        }
      } else {
        setSearchError("找不到此地點，請嘗試其他關鍵字");
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setSearchError("搜尋逾時，請稍後再試");
      } else {
        setSearchError("搜尋失敗，請稍後再試");
      }
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl overflow-hidden flex flex-col" style={{ height: "80vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Select Location on Map
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-stone-200 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="搜尋地點 (如: 東京, 曼谷, 台北101)"
                className="w-full pl-10 pr-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                disabled={isSearching}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4 py-2 bg-stone-700 text-white rounded-md hover:bg-stone-800 text-sm disabled:bg-stone-400 flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  搜尋中
                </>
              ) : (
                "搜尋"
              )}
            </button>
          </div>
          {searchError ? (
            <p className="text-xs text-red-500 mt-2">{searchError}</p>
          ) : (
            <p className="text-xs text-stone-500 mt-2">
              點擊地圖任意位置選擇座標，或搜尋地點名稱
            </p>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-0">
          <style jsx global>{`
            .leaflet-tile {
              filter: saturate(0.7) brightness(1.08) contrast(0.85) sepia(0.1);
            }
            .leaflet-container {
              background: #f5f3ef;
            }
          `}</style>
          <div ref={mapContainerRef} className="absolute inset-0" />
          {!isMapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400 mx-auto" />
                <p className="mt-2 text-sm text-stone-500">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Coordinates Display */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 shrink-0">
          {tempCoords ? (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              已選擇: <span className="font-mono">{tempCoords.lat.toFixed(6)}, {tempCoords.lng.toFixed(6)}</span>
            </p>
          ) : (
            <p className="text-sm text-stone-400">尚未選擇位置</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-4 border-t border-stone-200 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              if (tempCoords) {
                onSelect(tempCoords.lat, tempCoords.lng);
              }
            }}
            disabled={!tempCoords}
            className="px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors disabled:bg-stone-400"
          >
            確認位置
          </button>
        </div>
      </div>
    </div>
  );
}
