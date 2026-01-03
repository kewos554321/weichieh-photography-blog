"use client";

import { TagManager } from "@/components/admin";

export default function PhotoTagsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Photo Tags</h1>
      <TagManager
        title="Photo Tags"
        apiPath="/api/photos/tags"
        countField="photos"
      />
    </div>
  );
}
