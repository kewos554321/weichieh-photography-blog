"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import type { AnalyticsData } from "../types";
import {
  Eye,
  Image as ImageIcon,
  FileText,
  Clock,
  Loader2,
} from "lucide-react";

export function AnalyticsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-stone-500">
        Failed to load analytics
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-stone-900">Analytics</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{data.overview.totalViews.toLocaleString()}</p>
              <p className="text-sm text-stone-500">Total Views</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <ImageIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{data.overview.publishedPhotos}</p>
              <p className="text-sm text-stone-500">Published Photos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{data.overview.publishedPosts}</p>
              <p className="text-sm text-stone-500">Published Articles</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{data.overview.draftPhotos + data.overview.draftPosts}</p>
              <p className="text-sm text-stone-500">Drafts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Views Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium text-stone-900 mb-4">Photo Views</h2>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-semibold text-stone-900">{data.overview.photoViews.toLocaleString()}</span>
            <span className="text-sm text-stone-500 mb-1">total views</span>
          </div>
          <div className="mt-4 h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${data.overview.totalViews > 0 ? (data.overview.photoViews / data.overview.totalViews) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium text-stone-900 mb-4">Article Views</h2>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-semibold text-stone-900">{data.overview.postViews.toLocaleString()}</span>
            <span className="text-sm text-stone-500 mb-1">total views</span>
          </div>
          <div className="mt-4 h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${data.overview.totalViews > 0 ? (data.overview.postViews / data.overview.totalViews) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Photos */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <h2 className="text-lg font-medium text-stone-900">Top Photos</h2>
          </div>
          {data.topPhotos.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No data yet</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {data.topPhotos.map((photo, index) => (
                <div key={photo.id} className="flex items-center gap-4 p-4 hover:bg-stone-50">
                  <span className="text-lg font-medium text-stone-400 w-6">{index + 1}</span>
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    <Image src={photo.src} alt={photo.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 truncate">{photo.title}</p>
                    <p className="text-xs text-stone-500">{photo.category}</p>
                  </div>
                  <div className="flex items-center gap-1 text-stone-500">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{photo.viewCount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Articles */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <h2 className="text-lg font-medium text-stone-900">Top Articles</h2>
          </div>
          {data.topPosts.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No data yet</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {data.topPosts.map((article, index) => (
                <div key={article.id} className="flex items-center gap-4 p-4 hover:bg-stone-50">
                  <span className="text-lg font-medium text-stone-400 w-6">{index + 1}</span>
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    <Image src={article.cover} alt={article.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 truncate">{article.title}</p>
                    <p className="text-xs text-stone-500">{article.category}</p>
                  </div>
                  <div className="flex items-center gap-1 text-stone-500">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{article.viewCount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Photo Categories */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <h2 className="text-lg font-medium text-stone-900">Photo Categories</h2>
          </div>
          {data.photoCategoryStats.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No data yet</div>
          ) : (
            <div className="p-4 space-y-3">
              {data.photoCategoryStats.map((stat) => (
                <div key={stat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 text-xs bg-stone-100 text-stone-700 rounded">{stat.category}</span>
                    <span className="text-sm text-stone-500">{stat.count} photos</span>
                  </div>
                  <span className="text-sm font-medium text-stone-900">{stat.views.toLocaleString()} views</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Article Categories */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <h2 className="text-lg font-medium text-stone-900">Article Categories</h2>
          </div>
          {data.postCategoryStats.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No data yet</div>
          ) : (
            <div className="p-4 space-y-3">
              {data.postCategoryStats.map((stat) => (
                <div key={stat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 text-xs bg-stone-100 text-stone-700 rounded">{stat.category}</span>
                    <span className="text-sm text-stone-500">{stat.count} articles</span>
                  </div>
                  <span className="text-sm font-medium text-stone-900">{stat.views.toLocaleString()} views</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Last 30 Days</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center p-4 bg-stone-50 rounded-lg">
            <p className="text-3xl font-semibold text-green-600">{data.overview.recentPhotos}</p>
            <p className="text-sm text-stone-500 mt-1">New Photos Published</p>
          </div>
          <div className="text-center p-4 bg-stone-50 rounded-lg">
            <p className="text-3xl font-semibold text-purple-600">{data.overview.recentPosts}</p>
            <p className="text-sm text-stone-500 mt-1">New Articles Published</p>
          </div>
        </div>
      </div>
    </div>
  );
}
