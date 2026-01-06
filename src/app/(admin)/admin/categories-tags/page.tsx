"use client";

import { Suspense } from "react";
import { CategoriesTagsManager } from "@/components/admin/CategoriesTagsManager";

function CategoriesTagsContent() {
  return <CategoriesTagsManager />;
}

export default function CategoriesTagsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">
        Categories & Tags
      </h1>
      <Suspense fallback={<div className="text-stone-500">Loading...</div>}>
        <CategoriesTagsContent />
      </Suspense>
    </div>
  );
}
