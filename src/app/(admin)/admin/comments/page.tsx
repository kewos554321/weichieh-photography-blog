"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Loader2,
  Check,
  X,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  FileText,
} from "lucide-react";

interface Comment {
  id: number;
  name: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  photo?: { id: number; slug: string; title: string } | null;
  article?: { id: number; slug: string; title: string } | null;
}

type FilterStatus = "all" | "PENDING" | "APPROVED" | "REJECTED";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("PENDING");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusParam = filter === "all" ? "" : `&status=${filter}`;
      const res = await fetch(`/api/comments?page=${page}&limit=20${statusParam}`);
      const data = await res.json();
      setComments(data.comments || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleApprove = async (id: number) => {
    try {
      await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      fetchComments();
    } catch (error) {
      console.error("Failed to approve comment:", error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      fetchComments();
    } catch (error) {
      console.error("Failed to reject comment:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除此留言嗎？")) return;

    try {
      await fetch(`/api/comments/${id}`, { method: "DELETE" });
      fetchComments();
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-TW", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColors = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  const statusIcons = {
    PENDING: Clock,
    APPROVED: CheckCircle,
    REJECTED: XCircle,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Comments</h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage and moderate user comments
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["PENDING", "APPROVED", "REJECTED", "all"] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === status
                ? "bg-stone-900 text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {status === "PENDING" && "待審核"}
            {status === "APPROVED" && "已批准"}
            {status === "REJECTED" && "已拒絕"}
            {status === "all" && "全部"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <MessageSquare className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg">No comments</p>
        </div>
      ) : (
        <>
          {/* Comment List */}
          <div className="space-y-4">
            {comments.map((comment) => {
              const StatusIcon = statusIcons[comment.status];
              return (
                <div
                  key={comment.id}
                  className="bg-white rounded-lg border border-stone-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-stone-800">
                          {comment.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${
                            statusColors[comment.status]
                          }`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {comment.status === "PENDING" && "待審核"}
                          {comment.status === "APPROVED" && "已批准"}
                          {comment.status === "REJECTED" && "已拒絕"}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-stone-600 mb-3 whitespace-pre-wrap">
                        {comment.content}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-stone-400">
                        <span>{formatDate(comment.createdAt)}</span>
                        {comment.photo && (
                          <Link
                            href={`/photo/${comment.photo.slug}`}
                            className="flex items-center gap-1 hover:text-[#6b9e9a]"
                          >
                            <ImageIcon className="w-3 h-3" />
                            {comment.photo.title}
                          </Link>
                        )}
                        {comment.article && (
                          <Link
                            href={`/blog/${comment.article.slug}`}
                            className="flex items-center gap-1 hover:text-[#6b9e9a]"
                          >
                            <FileText className="w-3 h-3" />
                            {comment.article.title}
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {comment.status !== "APPROVED" && (
                        <button
                          onClick={() => handleApprove(comment.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="批准"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {comment.status !== "REJECTED" && (
                        <button
                          onClick={() => handleReject(comment.id)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="拒絕"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-stone-500">
                共 {total} 則留言
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-stone-200 rounded hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一頁
                </button>
                <span className="px-3 py-1 text-sm">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-stone-200 rounded hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一頁
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
