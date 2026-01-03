"use client";

import { ProfileManager, WatermarkSettings } from "@/components/admin/settings";

export default function SettingsPage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 mb-6">Settings</h1>
        <ProfileManager />
      </div>
      <div className="border-t border-stone-200 pt-12">
        <WatermarkSettings />
      </div>
    </div>
  );
}
