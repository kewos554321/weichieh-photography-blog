"use client";

import { TagManager } from "@/components/admin";

export default function ArticleTagsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Article Tags</h1>
      <TagManager
        title="Article Tags"
        apiPath="/api/articles/tags"
        countField="articles"
      />
    </div>
  );
}
