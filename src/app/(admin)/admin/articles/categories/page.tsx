"use client";

import { CategoryManager } from "@/components/admin";

export default function ArticleCategoriesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Article Categories</h1>
      <CategoryManager
        title="Article Categories"
        apiPath="/api/articles/categories"
        itemLabel="分類"
      />
    </div>
  );
}
