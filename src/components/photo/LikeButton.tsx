"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  photoSlug: string;
}

export function LikeButton({ photoSlug }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check initial like status
    const fetchLikeStatus = async () => {
      try {
        const res = await fetch(`/api/photos/${photoSlug}/like`);
        if (res.ok) {
          const data = await res.json();
          setLiked(data.liked);
          setLikeCount(data.likeCount);
        }
      } catch (error) {
        console.error("Failed to fetch like status:", error);
      }
    };

    fetchLikeStatus();
  }, [photoSlug]);

  const handleLike = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setIsAnimating(true);

    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((prev) => prev + (wasLiked ? -1 : 1));

    try {
      const res = await fetch(`/api/photos/${photoSlug}/like`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      } else {
        // Revert on failure
        setLiked(wasLiked);
        setLikeCount((prev) => prev + (wasLiked ? 1 : -1));
      }
    } catch (error) {
      // Revert on error
      console.error("Failed to toggle like:", error);
      setLiked(wasLiked);
      setLikeCount((prev) => prev + (wasLiked ? 1 : -1));
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`group flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
        liked
          ? "bg-red-50 border-red-200 text-red-500"
          : "bg-white border-stone-200 text-stone-500 hover:border-red-200 hover:text-red-400"
      }`}
      aria-label={liked ? "取消收藏" : "收藏"}
    >
      <Heart
        className={`w-5 h-5 transition-transform duration-300 ${
          liked ? "fill-current" : ""
        } ${isAnimating ? "scale-125" : ""}`}
      />
      <span className="text-sm font-medium">{likeCount}</span>
    </button>
  );
}
