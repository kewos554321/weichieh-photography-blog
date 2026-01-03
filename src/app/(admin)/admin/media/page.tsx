"use client";

import { MediaLibraryContent } from "@/components/admin/media";

export default function MediaPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Media Library</h1>
      <MediaLibraryContent />
    </div>
  );
}
