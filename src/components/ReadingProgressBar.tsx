"use client";

import { useState, useEffect } from "react";

interface ReadingProgressBarProps {
  targetRef?: React.RefObject<HTMLElement | null>;
}

export function ReadingProgressBar({ targetRef }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      let progressValue = 0;

      if (targetRef?.current) {
        // Calculate progress based on target element
        const element = targetRef.current;
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollY = window.scrollY;

        const start = elementTop - windowHeight;
        const end = elementTop + elementHeight - windowHeight;
        progressValue = Math.min(100, Math.max(0, ((scrollY - start) / (end - start)) * 100));
      } else {
        // Calculate progress based on entire page
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        progressValue = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      }

      setProgress(progressValue);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleScroll);
  }, [targetRef]);

  return (
    <div className="fixed top-14 md:top-16 left-0 right-0 h-0.5 bg-[var(--card-border)] z-40">
      <div
        className="h-full bg-[var(--accent-teal)] transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
