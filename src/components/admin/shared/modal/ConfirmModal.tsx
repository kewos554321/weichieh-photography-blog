"use client";

import { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { BaseModal } from "./BaseModal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "warning" | "default";
  isLoading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
}

const variantClasses = {
  danger: "bg-red-500 hover:bg-red-600",
  warning: "bg-amber-500 hover:bg-amber-600",
  default: "bg-stone-900 hover:bg-stone-800",
};

const iconColors = {
  danger: "text-red-500",
  warning: "text-amber-500",
  default: "text-stone-500",
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  isLoading = false,
  loadingLabel = "Processing...",
  icon,
}: ConfirmModalProps) {
  const defaultIcon = (
    <AlertTriangle className={`w-5 h-5 ${iconColors[confirmVariant]}`} />
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      titleIcon={icon || defaultIcon}
      size="md"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      zIndex={60} // Higher z-index for nested modals
    >
      <div className="p-4 space-y-4">
        <div className="text-stone-700">
          {typeof message === "string" ? <p>{message}</p> : message}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-stone-700 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${variantClasses[confirmVariant]}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {loadingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
