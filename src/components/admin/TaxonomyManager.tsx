"use client";

import { useState } from "react";
import { FolderOpen, Tag } from "lucide-react";
import { CategoryManager } from "./CategoryManager";
import { TagManager } from "./TagManager";

type Tab = "categories" | "tags";

interface TaxonomyManagerProps {
  type: "photos" | "articles" | "media";
}

export function TaxonomyManager({ type }: TaxonomyManagerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("categories");

  const config = {
    photos: {
      categoryApiPath: "/api/photos/categories",
      tagApiPath: "/api/photos/tags",
      categoryLabel: "分類",
      tagCountField: "photos",
    },
    articles: {
      categoryApiPath: "/api/articles/categories",
      tagApiPath: "/api/articles/tags",
      categoryLabel: "分類",
      tagCountField: "articles",
    },
    media: {
      categoryApiPath: "/api/media/folders",
      tagApiPath: "/api/media/tags",
      categoryLabel: "資料夾",
      tagCountField: "media",
    },
  };

  const { categoryApiPath, tagApiPath, categoryLabel, tagCountField } = config[type];

  const tabs = [
    { id: "categories" as Tab, label: type === "media" ? "Folders" : "Categories", icon: FolderOpen },
    { id: "tags" as Tab, label: "Tags", icon: Tag },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-stone-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "categories" && (
        <CategoryManager
          title={type === "media" ? "Media Folders" : `${type === "photos" ? "Photo" : "Article"} Categories`}
          apiPath={categoryApiPath}
          itemLabel={categoryLabel}
        />
      )}
      {activeTab === "tags" && (
        <TagManager
          title={type === "media" ? "Media Tags" : `${type === "photos" ? "Photo" : "Article"} Tags`}
          apiPath={tagApiPath}
          countField={tagCountField}
        />
      )}
    </div>
  );
}
