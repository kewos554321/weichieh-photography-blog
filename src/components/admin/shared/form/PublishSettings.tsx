"use client";

import { Eye, EyeOff, Clock } from "lucide-react";

export type PublishStatus = "draft" | "scheduled" | "published";

interface PublishSettingsProps {
  status: PublishStatus;
  publishedAt: string;
  onStatusChange: (status: PublishStatus) => void;
  onPublishedAtChange: (datetime: string) => void;
  label?: string;
  radioName?: string;
  disabled?: boolean;
  draftLabel?: string;
  scheduledLabel?: string;
  publishedLabel?: string;
  className?: string;
}

export function PublishSettings({
  status,
  publishedAt,
  onStatusChange,
  onPublishedAtChange,
  label = "Publish Settings",
  radioName = "status",
  disabled = false,
  draftLabel = "Draft",
  scheduledLabel = "Scheduled",
  publishedLabel = "Published",
  className = "",
}: PublishSettingsProps) {
  const handleStatusChange = (newStatus: PublishStatus) => {
    onStatusChange(newStatus);
    // Clear publishedAt when changing to draft or published
    if (newStatus !== "scheduled") {
      onPublishedAtChange("");
    }
  };

  return (
    <div className={`p-4 bg-stone-50 rounded-lg space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      <div className="flex flex-col gap-2">
        {/* Draft */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={radioName}
            value="draft"
            checked={status === "draft"}
            onChange={() => handleStatusChange("draft")}
            disabled={disabled}
            className="text-stone-900"
          />
          <EyeOff className="w-4 h-4 text-stone-500" />
          <span className="text-sm text-stone-700">{draftLabel}</span>
        </label>

        {/* Scheduled */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={radioName}
            value="scheduled"
            checked={status === "scheduled"}
            onChange={() => handleStatusChange("scheduled")}
            disabled={disabled}
            className="text-stone-900"
          />
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-stone-700">{scheduledLabel}</span>
        </label>

        {/* DateTime picker for scheduled */}
        {status === "scheduled" && (
          <div className="ml-6">
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => onPublishedAtChange(e.target.value)}
              disabled={disabled}
              className="px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:opacity-50"
              required
            />
          </div>
        )}

        {/* Published */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={radioName}
            value="published"
            checked={status === "published"}
            onChange={() => handleStatusChange("published")}
            disabled={disabled}
            className="text-stone-900"
          />
          <Eye className="w-4 h-4 text-green-700" />
          <span className="text-sm text-stone-700">{publishedLabel}</span>
        </label>
      </div>
    </div>
  );
}
