"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import type { SEOData } from "../types";
import {
  X,
  Upload,
  CheckCircle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

export function SEOManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [seo, setSeo] = useState<SEOData>({
    siteTitle: "",
    siteDescription: "",
    siteKeywords: [],
    ogImage: "",
    twitterHandle: "",
    googleAnalyticsId: "",
    googleSearchConsoleId: "",
    facebookPixelId: "",
  });
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    const fetchSEO = async () => {
      try {
        const res = await fetch("/api/settings/seo");
        const data = await res.json();
        setSeo(data);
      } catch (error) {
        console.error("Failed to fetch SEO settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSEO();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seo),
      });
      if (res.ok) {
        alert("SEO settings saved successfully!");
      } else {
        alert("Failed to save SEO settings");
      }
    } catch {
      alert("Failed to save SEO settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "og-image");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSeo({ ...seo, ogImage: data.url });
      } else {
        alert("Failed to upload image");
      }
    } catch {
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const addKeyword = () => {
    const value = newKeyword.trim().toLowerCase();
    if (!value || seo.siteKeywords.includes(value)) return;
    setSeo({ ...seo, siteKeywords: [...seo.siteKeywords, value] });
    setNewKeyword("");
  };

  const removeKeyword = (index: number) => {
    setSeo({ ...seo, siteKeywords: seo.siteKeywords.filter((_, i) => i !== index) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Basic SEO */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Basic SEO</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Site Title</label>
            <input
              type="text"
              value={seo.siteTitle}
              onChange={(e) => setSeo({ ...seo, siteTitle: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="WeiChieh Photography"
            />
            <p className="text-xs text-stone-400 mt-1">Appears in browser tab and search results</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Site Description</label>
            <textarea
              value={seo.siteDescription}
              onChange={(e) => setSeo({ ...seo, siteDescription: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
              placeholder="A photography blog capturing moments and stories..."
            />
            <p className="text-xs text-stone-400 mt-1">Recommended: 150-160 characters for search results</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Keywords</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="Add keyword..."
              />
              <button
                onClick={addKeyword}
                className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {seo.siteKeywords.map((keyword, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
                >
                  {keyword}
                  <button onClick={() => removeKeyword(i)} className="text-stone-400 hover:text-stone-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Open Graph */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Social Sharing (Open Graph)</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Default Share Image</label>
            <div className="flex items-start gap-4">
              <div className="relative w-48 h-24 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                {seo.ogImage ? (
                  <Image src={seo.ogImage} alt="OG Image" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-stone-400" />
                  </div>
                )}
              </div>
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 cursor-pointer transition-colors">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleOgImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-xs text-stone-400 mt-2">Recommended: 1200x630px for best display</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Twitter Handle</label>
            <input
              type="text"
              value={seo.twitterHandle}
              onChange={(e) => setSeo({ ...seo, twitterHandle: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="@username"
            />
          </div>
        </div>
      </div>

      {/* Analytics & Tracking */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Analytics & Tracking</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Google Analytics ID</label>
            <input
              type="text"
              value={seo.googleAnalyticsId}
              onChange={(e) => setSeo({ ...seo, googleAnalyticsId: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="G-XXXXXXXXXX"
            />
            <p className="text-xs text-stone-400 mt-1">Google Analytics 4 Measurement ID</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Google Search Console</label>
            <input
              type="text"
              value={seo.googleSearchConsoleId}
              onChange={(e) => setSeo({ ...seo, googleSearchConsoleId: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="Verification code or meta tag content"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Facebook Pixel ID</label>
            <input
              type="text"
              value={seo.facebookPixelId}
              onChange={(e) => setSeo({ ...seo, facebookPixelId: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="123456789012345"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save SEO Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
