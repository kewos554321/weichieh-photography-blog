"use client";

import { ReactNode, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";

type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleIcon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  zIndex?: number;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-[95vw]",
};

export function BaseModal({
  isOpen,
  onClose,
  title,
  titleIcon,
  children,
  footer,
  size = "lg",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  isLoading = false,
  loadingMessage = "Processing...",
  zIndex = 50,
  className = "",
}: BaseModalProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape && !isLoading) {
        onClose();
      }
    },
    [closeOnEscape, isLoading, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4`}
      style={{ zIndex }}
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-white rounded-lg w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto shadow-xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            {titleIcon}
            {title}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-stone-100 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative">
          {children}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-stone-600" />
                <span className="text-sm text-stone-600">{loadingMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-stone-200 bg-stone-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ModalFooter 工具元件
interface ModalFooterProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  isLoading?: boolean;
  submitDisabled?: boolean;
  submitVariant?: "primary" | "danger";
  children?: ReactNode;
}

export function ModalFooter({
  onCancel,
  onSubmit,
  cancelLabel = "Cancel",
  submitLabel = "Save",
  isLoading = false,
  submitDisabled = false,
  submitVariant = "primary",
  children,
}: ModalFooterProps) {
  const submitClasses =
    submitVariant === "danger"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-stone-900 hover:bg-stone-800";

  return (
    <div className="flex justify-end gap-3">
      {children}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-stone-700 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
      )}
      {onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || submitDisabled}
          className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${submitClasses}`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      )}
    </div>
  );
}
