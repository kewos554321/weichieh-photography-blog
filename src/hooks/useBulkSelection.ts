import { useState, useCallback, useRef } from "react";

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
  toggleSelect: (id: number | string, shiftKey?: boolean) => void;
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
  const lastSelectedIndexRef = useRef<number | null>(null);

  const toggleSelect = useCallback(
    (id: number | string, shiftKey: boolean = false) => {
      const currentIndex = items.findIndex((item) => getItemId(item) === id);

      if (shiftKey && lastSelectedIndexRef.current !== null && currentIndex !== -1) {
        // Shift+click: select range
        const start = Math.min(lastSelectedIndexRef.current, currentIndex);
        const end = Math.max(lastSelectedIndexRef.current, currentIndex);

        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          for (let i = start; i <= end; i++) {
            newSet.add(getItemId(items[i]));
          }
          return newSet;
        });
      } else {
        // Normal click: toggle single item
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
      }

      // Update last selected index
      if (currentIndex !== -1) {
        lastSelectedIndexRef.current = currentIndex;
      }
    },
    [items, getItemId]
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === items.length) {
        return new Set();
      }
      return new Set(items.map(getItemId));
    });
    lastSelectedIndexRef.current = null;
  }, [items, getItemId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastSelectedIndexRef.current = null;
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
