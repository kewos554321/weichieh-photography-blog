"use client";

import { TaxonomyManager } from "@/components/admin";

export default function PhotoTaxonomyPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Photo Taxonomy</h1>
      <TaxonomyManager type="photos" />
    </div>
  );
}
