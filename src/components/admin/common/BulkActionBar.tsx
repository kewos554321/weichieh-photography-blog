"use client";

import { Trash2 } from "lucide-react";
import { ReactNode } from "react";

export interface BulkAction {
  key: string;
  label: string;
  icon?: ReactNode;
  variant?: "default" | "danger";
  options?: { value: string; label: string }[];
  onAction: (value?: string) => void;
}

export interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: BulkAction[];
  disabled?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onClear,
  actions,
  disabled = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-stone-900 text-white rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm">{selectedCount} selected</span>
        <button
          onClick={onClear}
          className="text-xs text-stone-400 hover:text-white"
        >
          Clear
        </button>
      </div>
      <div className="flex items-center gap-2">
        {actions.map((action) =>
          action.options ? (
            <select
              key={action.key}
              onChange={(e) => {
                if (e.target.value) {
                  action.onAction(e.target.value);
                  e.target.value = "";
                }
              }}
              disabled={disabled}
              className="px-3 py-1.5 bg-stone-800 border border-stone-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            >
              <option value="">{action.label}</option>
              {action.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <button
              key={action.key}
              onClick={() => action.onAction()}
              disabled={disabled}
              className={`px-3 py-1.5 rounded text-sm disabled:opacity-50 flex items-center gap-1 ${
                action.variant === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-stone-700 hover:bg-stone-600"
              }`}
            >
              {action.icon || (action.variant === "danger" && <Trash2 className="w-4 h-4" />)}
              {action.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}
