import { useState, useCallback } from "react";

export interface UseBulkSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => number | string;
}

export interface UseBulkSelectionReturn<T> {
  selectedIds: Set<number | string>;
  selectedItems: T[];
  selectedCount: number;
  isAllSelected: boolean;
  isBulkUpdating: boolean;
  toggleSelect: (id: number | string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  setIsBulkUpdating: (value: boolean) => void;
  isSelected: (id: number | string) => boolean;
}

export function useBulkSelection<T>({
  items,
  getItemId,
}: UseBulkSelectionOptions<T>): UseBulkSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(
    new Set()
  );
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const toggleSelect = useCallback((id: number | string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === items.length) {
        return new Set();
      }
      return new Set(items.map(getItemId));
    });
  }, [items, getItemId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: number | string) => selectedIds.has(id),
    [selectedIds]
  );

  const selectedItems = items.filter((item) => selectedIds.has(getItemId(item)));
  const isAllSelected = items.length > 0 && selectedIds.size === items.length;

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    isAllSelected,
    isBulkUpdating,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    setIsBulkUpdating,
    isSelected,
  };
}
