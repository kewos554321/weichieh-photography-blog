"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Camera, FileText, Image, Images } from "lucide-react";
import { CategoryManager } from "./CategoryManager";
import { TagManager } from "./TagManager";

type ContentType = "photos" | "albums" | "articles" | "media";

const config = {
  photos: {
    categoryApiPath: "/api/photos/categories",
    tagApiPath: "/api/photos/tags",
    categoryLabel: "分類",
    categoryTitle: "Photo Categories",
    tagTitle: "Photo Tags",
    tagCountField: "photos",
  },
  albums: {
    categoryApiPath: "/api/albums/categories",
    tagApiPath: "/api/albums/tags",
    categoryLabel: "分類",
    categoryTitle: "Album Categories",
    tagTitle: "Album Tags",
    tagCountField: "albums",
  },
  articles: {
    categoryApiPath: "/api/articles/categories",
    tagApiPath: "/api/articles/tags",
    categoryLabel: "分類",
    categoryTitle: "Post Categories",
    tagTitle: "Post Tags",
    tagCountField: "articles",
  },
  media: {
    categoryApiPath: "/api/media/folders",
    tagApiPath: "/api/media/tags",
    categoryLabel: "資料夾",
    categoryTitle: "Media Folders",
    tagTitle: "Media Tags",
    tagCountField: "media",
  },
};

const contentTypes: { id: ContentType; label: string; icon: typeof Camera }[] = [
  { id: "photos", label: "Photos", icon: Camera },
  { id: "albums", label: "Albums", icon: Images },
  { id: "articles", label: "Posts", icon: FileText },
  { id: "media", label: "Media", icon: Image },
];

export function CategoriesTagsManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") as ContentType | null;

  // Use URL param as source of truth, fallback to "photos"
  const activeType: ContentType = typeParam && config[typeParam] ? typeParam : "photos";

  const handleTypeChange = (type: ContentType) => {
    router.push(`/admin/categories-tags?type=${type}`, { scroll: false });
  };

  const currentConfig = config[activeType];

  return (
    <div className="space-y-6">
      {/* Content Type Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-lg w-fit">
        {contentTypes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTypeChange(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeType === id
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Two-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Column */}
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <CategoryManager
            title={currentConfig.categoryTitle}
            apiPath={currentConfig.categoryApiPath}
            itemLabel={currentConfig.categoryLabel}
          />
        </div>

        {/* Tags Column */}
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <TagManager
            title={currentConfig.tagTitle}
            apiPath={currentConfig.tagApiPath}
            countField={currentConfig.tagCountField}
          />
        </div>
      </div>
    </div>
  );
}
