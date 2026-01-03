"use client";

import { ProfileManager } from "@/components/admin/settings";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Settings</h1>
      <ProfileManager />
    </div>
  );
}
