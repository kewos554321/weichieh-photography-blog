"use client";

import {
  Eye,
  EyeOff,
  Clock,
  Globe,
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

type BadgeVariant =
  | "published"
  | "draft"
  | "scheduled"
  | "active"
  | "expired"
  | "disabled"
  | "public"
  | "private";

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  showIcon?: boolean;
  size?: "sm" | "md";
  scheduledAt?: string;
}

const variantConfig: Record<
  BadgeVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    className: string;
  }
> = {
  published: {
    icon: Eye,
    label: "Published",
    className: "text-green-700",
  },
  draft: {
    icon: EyeOff,
    label: "Draft",
    className: "text-stone-500",
  },
  scheduled: {
    icon: Clock,
    label: "Scheduled",
    className: "text-amber-600",
  },
  active: {
    icon: CheckCircle,
    label: "Active",
    className: "text-green-700",
  },
  expired: {
    icon: AlertCircle,
    label: "Expired",
    className: "text-red-600",
  },
  disabled: {
    icon: XCircle,
    label: "Disabled",
    className: "text-stone-400",
  },
  public: {
    icon: Globe,
    label: "Public",
    className: "text-green-700",
  },
  private: {
    icon: Lock,
    label: "Private",
    className: "text-stone-500",
  },
};

const sizeClasses = {
  sm: {
    icon: "w-3 h-3",
    text: "text-xs",
    scheduledText: "text-[10px]",
  },
  md: {
    icon: "w-4 h-4",
    text: "text-sm",
    scheduledText: "text-xs",
  },
};

export function StatusBadge({
  variant,
  label,
  showIcon = true,
  size = "sm",
  scheduledAt,
}: StatusBadgeProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const sizes = sizeClasses[size];

  return (
    <span className="flex flex-col gap-0.5">
      <span className={`flex items-center gap-1 ${sizes.text} ${config.className}`}>
        {showIcon && <Icon className={sizes.icon} />}
        {label || config.label}
      </span>
      {variant === "scheduled" && scheduledAt && (
        <span className={`${sizes.scheduledText} text-stone-400`}>
          {new Date(scheduledAt).toLocaleString()}
        </span>
      )}
    </span>
  );
}
