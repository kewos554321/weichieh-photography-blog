"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 md:bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[var(--foreground)] text-[var(--background)] shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center group"
      aria-label="Back to top"
    >
      <ChevronUp className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
}
