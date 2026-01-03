"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface CommentFormProps {
  photoId?: number;
  articleId?: number;
  onSuccess?: () => void;
}

export function CommentForm({ photoId, articleId, onSuccess }: CommentFormProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          content: content.trim(),
          photoId,
          articleId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "留言失敗");
      }

      setName("");
      setContent("");
      setMessage({
        type: "success",
        text: "留言已送出，待審核後即會顯示",
      });
      onSuccess?.();

      // Clear success message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "留言失敗，請稍後再試",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label htmlFor="comment-name" className="block text-sm font-medium text-stone-700 mb-1">
          名稱
        </label>
        <input
          id="comment-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="您的名稱"
          maxLength={50}
          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b9e9a] focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="comment-content" className="block text-sm font-medium text-stone-700 mb-1">
          留言內容
        </label>
        <textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享您的想法..."
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b9e9a] focus:border-transparent resize-none"
          required
        />
        <p className="text-xs text-stone-400 mt-1 text-right">
          {content.length}/1000
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !name.trim() || !content.trim()}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#6b9e9a] text-white rounded-lg hover:bg-[#5a8a87] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            送出中...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            送出留言
          </>
        )}
      </button>
    </form>
  );
}
