"use client";

import { SEOManager } from "@/components/admin/settings";

export default function SEOSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">SEO & Analytics</h1>
      <SEOManager />
    </div>
  );
}
