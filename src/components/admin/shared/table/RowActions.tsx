"use client";

import { ReactNode } from "react";
import { Edit2, Trash2 } from "lucide-react";

export interface RowAction<T> {
  key: string;
  icon: ReactNode;
  label: string;
  onClick: (item: T) => void;
  variant?: "default" | "danger" | "success" | "warning";
  show?: (item: T) => boolean;
  disabled?: (item: T) => boolean;
}

interface RowActionsProps<T> {
  item: T;
  actions: RowAction<T>[];
  alignment?: "left" | "right";
  className?: string;
}

const variantClasses = {
  default: "text-stone-500 hover:text-stone-700 hover:bg-stone-100",
  danger: "text-red-500 hover:text-red-700 hover:bg-red-50",
  success: "text-green-500 hover:text-green-700 hover:bg-green-50",
  warning: "text-amber-500 hover:text-amber-700 hover:bg-amber-50",
};

export function RowActions<T>({
  item,
  actions,
  alignment = "right",
  className = "",
}: RowActionsProps<T>) {
  const visibleActions = actions.filter(
    (action) => !action.show || action.show(item)
  );

  if (visibleActions.length === 0) return null;

  return (
    <div
      className={`flex items-center gap-1 ${
        alignment === "right" ? "justify-end" : "justify-start"
      } ${className}`}
    >
      {visibleActions.map((action) => {
        const isDisabled = action.disabled?.(item);
        const variant = action.variant || "default";

        return (
          <button
            key={action.key}
            onClick={() => action.onClick(item)}
            disabled={isDisabled}
            title={action.label}
            className={`p-2 rounded transition-colors ${variantClasses[variant]} ${
              isDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {action.icon}
          </button>
        );
      })}
    </div>
  );
}

// 預設的編輯和刪除操作工廠函數
export function createEditAction<T>(
  onClick: (item: T) => void
): RowAction<T> {
  return {
    key: "edit",
    icon: <Edit2 className="w-4 h-4" />,
    label: "Edit",
    onClick,
    variant: "default",
  };
}

export function createDeleteAction<T>(
  onClick: (item: T) => void
): RowAction<T> {
  return {
    key: "delete",
    icon: <Trash2 className="w-4 h-4" />,
    label: "Delete",
    onClick,
    variant: "danger",
  };
}
