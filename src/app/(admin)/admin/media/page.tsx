"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { MediaLibraryContent } from "@/components/admin/media";

function MediaLibraryLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
    </div>
  );
}

export default function MediaPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Media Library</h1>
      <Suspense fallback={<MediaLibraryLoading />}>
        <MediaLibraryContent />
      </Suspense>
    </div>
  );
}
