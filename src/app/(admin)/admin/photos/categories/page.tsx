"use client";

import { CategoryManager } from "@/components/admin";

export default function PhotoCategoriesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Photo Categories</h1>
      <CategoryManager
        title="Photo Categories"
        apiPath="/api/photos/categories"
        itemLabel="分類"
      />
    </div>
  );
}
