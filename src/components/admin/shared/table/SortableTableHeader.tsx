"use client";

import { ChevronUp, ChevronDown } from "lucide-react";

export type SortDirection = "asc" | "desc";

export interface Column<T extends string> {
  key: T;
  label: string;
  sortable?: boolean;
  className?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  align?: "left" | "center" | "right";
}

interface SortableTableHeaderProps<T extends string> {
  columns: Column<T>[];
  sortField: T | null;
  sortDirection: SortDirection;
  onSort: (field: T) => void;
  showSelectAll?: boolean;
  isAllSelected?: boolean;
  onSelectAll?: () => void;
  className?: string;
}

export function SortableTableHeader<T extends string>({
  columns,
  sortField,
  sortDirection,
  onSort,
  showSelectAll = false,
  isAllSelected = false,
  onSelectAll,
  className = "",
}: SortableTableHeaderProps<T>) {
  const SortIcon = ({ field }: { field: T }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const getAlignClass = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  const getVisibilityClass = (column: Column<T>) => {
    const classes: string[] = [];
    if (column.hideOnMobile) classes.push("hidden md:table-cell");
    if (column.hideOnTablet) classes.push("hidden lg:table-cell");
    return classes.join(" ");
  };

  return (
    <thead className={`bg-stone-50 border-b border-stone-200 ${className}`}>
      <tr>
        {showSelectAll && (
          <th className="px-4 py-3 text-left w-12">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={onSelectAll}
              className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
            />
          </th>
        )}
        {columns.map((column) => {
          const baseClasses = `px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider ${getAlignClass(column.align)} ${getVisibilityClass(column)} ${column.className || ""}`;

          if (column.sortable) {
            return (
              <th
                key={column.key}
                className={`${baseClasses} cursor-pointer hover:text-stone-700`}
                onClick={() => onSort(column.key)}
              >
                <div className={`flex items-center gap-1 ${column.align === "right" ? "justify-end" : ""}`}>
                  {column.label}
                  <SortIcon field={column.key} />
                </div>
              </th>
            );
          }

          return (
            <th key={column.key} className={baseClasses}>
              {column.label}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
