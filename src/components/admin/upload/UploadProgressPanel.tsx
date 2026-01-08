"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Minimize2,
  Maximize2,
  Pause,
  Play,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Upload,
} from "lucide-react";
import { useUpload, UploadBatch, UploadItem } from "./UploadContext";

// ============================================================================
// Progress Ring Component
// ============================================================================

function ProgressRing({
  progress,
  size = 32,
  strokeWidth = 3,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-stone-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-stone-700 transition-all duration-300"
      />
    </svg>
  );
}

// ============================================================================
// Upload Item Row
// ============================================================================

function UploadItemRow({
  batch,
  item,
  compact = false,
}: {
  batch: UploadBatch;
  item: UploadItem;
  compact?: boolean;
}) {
  const { retryItem, removeItem } = useUpload();

  const statusIcon = {
    pending: <div className="w-2 h-2 rounded-full bg-stone-300" />,
    uploading: <Loader2 className="w-4 h-4 animate-spin text-stone-600" />,
    done: <CheckCircle className="w-4 h-4 text-green-600" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
    paused: <Pause className="w-4 h-4 text-amber-500" />,
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 py-1 px-2 hover:bg-stone-50 rounded text-xs">
        {statusIcon[item.status]}
        <span className="flex-1 truncate text-stone-600">{item.file.name}</span>
        {item.status === "uploading" && (
          <span className="text-stone-400">{item.progress}%</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2 px-3 hover:bg-stone-50 rounded-lg group">
      {/* Thumbnail */}
      <div className="relative w-10 h-10 rounded overflow-hidden bg-stone-100 flex-shrink-0">
        <Image
          src={item.preview}
          alt={item.file.name}
          fill
          className="object-cover"
        />
        {item.status === "uploading" && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-700 truncate">
            {item.file.name}
          </span>
          {statusIcon[item.status]}
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          {item.folderPath && (
            <span className="flex items-center gap-1 truncate">
              <FolderOpen className="w-3 h-3" />
              {item.folderPath}
            </span>
          )}
          {item.status === "error" && item.error && (
            <span className="text-red-500 truncate">{item.error}</span>
          )}
          {item.status === "uploading" && <span>{item.progress}%</span>}
        </div>
      </div>

      {/* Progress Bar (when uploading) */}
      {item.status === "uploading" && (
        <div className="w-20 h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-stone-700 transition-all duration-300"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {item.status === "error" && item.retryCount < 3 && (
          <button
            onClick={() => retryItem(batch.id, item.id)}
            className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded"
            title="Retry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        {item.status !== "uploading" && (
          <button
            onClick={() => removeItem(batch.id, item.id)}
            className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Batch Section
// ============================================================================

function BatchSection({ batch }: { batch: UploadBatch }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { cancelBatch } = useUpload();

  const completed = batch.items.filter((i) => i.status === "done").length;
  const failed = batch.items.filter((i) => i.status === "error").length;
  const total = batch.items.length;

  const allDone = completed === total;
  const hasErrors = failed > 0;

  return (
    <div className="border-b border-stone-100 last:border-0">
      {/* Batch Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 hover:bg-stone-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-stone-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-stone-400" />
        )}

        <FolderOpen className="w-4 h-4 text-amber-500" />

        <span className="flex-1 text-sm font-medium text-stone-700 truncate">
          {batch.name}
        </span>

        <span className="text-xs text-stone-400">
          {completed}/{total}
          {hasErrors && <span className="text-red-500 ml-1">({failed} failed)</span>}
        </span>

        {allDone ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              cancelBatch(batch.id);
            }}
            className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"
            title="Cancel batch"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Batch Items */}
      {isExpanded && (
        <div className="pl-6 pr-2 pb-2">
          {batch.items.map((item) => (
            <UploadItemRow key={item.id} batch={batch} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Panel
// ============================================================================

export function UploadProgressPanel() {
  const {
    batches,
    isUploading,
    isPaused,
    isMinimized,
    pauseAll,
    resumeAll,
    cancelAll,
    retryFailed,
    clearCompleted,
    setMinimized,
    totalItems,
    completedItems,
    failedItems,
    overallProgress,
  } = useUpload();

  // Don't render if no uploads
  if (batches.length === 0) {
    return null;
  }

  const allDone = completedItems === totalItems;
  const hasErrors = failedItems > 0;

  // Minimized view
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 bg-white rounded-full shadow-lg border border-stone-200 p-2 cursor-pointer hover:shadow-xl transition-shadow flex items-center gap-3"
        onClick={() => setMinimized(false)}
      >
        <div className="relative">
          {allDone ? (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          ) : hasErrors && !isUploading ? (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <ProgressRing progress={overallProgress} size={40} strokeWidth={3} />
              <span className="absolute text-xs font-medium text-stone-700">
                {overallProgress}%
              </span>
            </div>
          )}
        </div>

        <div className="pr-2">
          <div className="text-sm font-medium text-stone-700">
            {allDone
              ? "Upload complete"
              : isPaused
                ? "Paused"
                : `Uploading ${completedItems}/${totalItems}`}
          </div>
          {hasErrors && (
            <div className="text-xs text-red-500">{failedItems} failed</div>
          )}
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-200">
        <div className="flex items-center gap-3">
          {isUploading ? (
            <div className="relative flex items-center justify-center">
              <ProgressRing progress={overallProgress} size={28} strokeWidth={2.5} />
              <Upload className="absolute w-3 h-3 text-stone-600" />
            </div>
          ) : allDone ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : hasErrors ? (
            <AlertCircle className="w-6 h-6 text-red-500" />
          ) : isPaused ? (
            <Pause className="w-6 h-6 text-amber-500" />
          ) : (
            <Upload className="w-6 h-6 text-stone-400" />
          )}

          <div>
            <div className="text-sm font-medium text-stone-700">
              {allDone
                ? "Upload complete"
                : isPaused
                  ? "Upload paused"
                  : `Uploading...`}
            </div>
            <div className="text-xs text-stone-400">
              {completedItems} of {totalItems} files
              {hasErrors && ` · ${failedItems} failed`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          {!allDone && (
            <button
              onClick={cancelAll}
              className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded"
              title="Cancel all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="h-1 bg-stone-200">
          <div
            className="h-full bg-stone-700 transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {batches.map((batch) => (
          <BatchSection key={batch.id} batch={batch} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-stone-50 border-t border-stone-200">
        <div className="flex items-center gap-2">
          {!allDone && (
            <>
              {isPaused ? (
                <button
                  onClick={resumeAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </button>
              )}
            </>
          )}

          {hasErrors && (
            <button
              onClick={retryFailed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry failed
            </button>
          )}
        </div>

        {completedItems > 0 && (
          <button
            onClick={clearCompleted}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear done
          </button>
        )}
      </div>
    </div>
  );
}
