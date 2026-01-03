"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Loader2, User } from "lucide-react";

interface Comment {
  id: number;
  name: string;
  content: string;
  createdAt: string;
}

interface CommentListProps {
  photoSlug?: string;
  articleSlug?: string;
  refreshKey?: number; // Increment to trigger refresh
}

export function CommentList({ photoSlug, articleSlug, refreshKey }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        let url = "";
        if (photoSlug) {
          url = `/api/photos/${photoSlug}/comments`;
        } else if (articleSlug) {
          url = `/api/articles/${articleSlug}/comments`;
        } else {
          return;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [photoSlug, articleSlug, refreshKey]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-stone-400">
        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>還沒有留言，成為第一個留言的人吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-stone-800 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        留言 ({comments.length})
      </h3>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-white rounded-lg border border-stone-200 p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-stone-500" />
              </div>
              <div>
                <p className="font-medium text-stone-800">{comment.name}</p>
                <p className="text-xs text-stone-400">{formatDate(comment.createdAt)}</p>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
