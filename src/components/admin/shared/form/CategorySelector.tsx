"use client";

import { ReactNode } from "react";
import { Filter } from "lucide-react";

interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  categories: string[];
  label?: string;
  icon?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function CategorySelector({
  value,
  onChange,
  categories,
  label = "Category",
  icon,
  required = false,
  disabled = false,
  placeholder,
  className = "",
}: CategorySelectorProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-stone-700 mb-1">
          {icon || <Filter className="w-3 h-3 inline mr-1" />}
          {label} {required && "*"}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}
