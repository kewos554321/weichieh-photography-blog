"use client";

import { ReactNode } from "react";
import { GRID_CLASSES, GridSize } from "./ViewModeToggle";

interface DataGridProps<T> {
  items: T[];
  size: GridSize;
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string | number;
  className?: string;
}

export function DataGrid<T>({
  items,
  size,
  renderItem,
  keyExtractor,
  className = "",
}: DataGridProps<T>) {
  return (
    <div className={`grid ${GRID_CLASSES[size]} gap-4 ${className}`}>
      {items.map((item) => (
        <div key={keyExtractor(item)}>{renderItem(item)}</div>
      ))}
    </div>
  );
}
