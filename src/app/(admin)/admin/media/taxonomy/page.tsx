"use client";

import { TaxonomyManager } from "@/components/admin";

export default function MediaTaxonomyPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Media Taxonomy</h1>
      <TaxonomyManager type="media" />
    </div>
  );
}
