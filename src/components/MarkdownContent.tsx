"use client";

import React from "react";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  const parseInlineMarkdown = (text: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Check for image: ![alt](url)
      const imgMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        result.push(
          <span key={key++} className="block my-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgMatch[2]}
              alt={imgMatch[1]}
              className="max-w-full rounded-lg mx-auto"
            />
            {imgMatch[1] && (
              <span className="block text-center text-sm text-stone-400 mt-2">
                {imgMatch[1]}
              </span>
            )}
          </span>
        );
        remaining = remaining.substring(imgMatch[0].length);
        continue;
      }

      // Check for link: [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        result.push(
          <a
            key={key++}
            href={linkMatch[2]}
            className="text-[#6b9e9a] underline underline-offset-2 hover:text-[#5a8a87] transition-colors"
            target={linkMatch[2].startsWith("http") ? "_blank" : undefined}
            rel={linkMatch[2].startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.substring(linkMatch[0].length);
        continue;
      }

      // Check for bold: **text**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        result.push(
          <strong key={key++} className="font-semibold text-stone-700">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.substring(boldMatch[0].length);
        continue;
      }

      // Check for italic: *text*
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        result.push(<em key={key++}>{italicMatch[1]}</em>);
        remaining = remaining.substring(italicMatch[0].length);
        continue;
      }

      // Find the next special character
      const nextSpecial = remaining.search(/\[|\*|!/);
      if (nextSpecial === -1) {
        result.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // No match found, move forward one character
        result.push(remaining[0]);
        remaining = remaining.substring(1);
      } else {
        result.push(remaining.substring(0, nextSpecial));
        remaining = remaining.substring(nextSpecial);
      }
    }

    return result;
  };

  const parseBlock = (block: string, index: number): React.ReactNode => {
    const trimmed = block.trim();

    // Empty block
    if (!trimmed) return null;

    // Heading 2
    if (trimmed.startsWith("## ")) {
      const title = trimmed.replace("## ", "");
      const id = title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, "-");
      return (
        <h2
          key={index}
          id={id}
          className="font-serif text-xl md:text-2xl mt-12 mb-6 text-stone-700 scroll-mt-24"
        >
          {title}
        </h2>
      );
    }

    // Heading 3
    if (trimmed.startsWith("### ")) {
      const title = trimmed.replace("### ", "");
      return (
        <h3 key={index} className="font-serif text-lg md:text-xl mt-8 mb-4 text-stone-700">
          {title}
        </h3>
      );
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      const quote = trimmed.replace(/^> /gm, "");
      return (
        <blockquote
          key={index}
          className="border-l-4 border-[#6b9e9a] pl-6 my-8 text-stone-500 italic"
        >
          {parseInlineMarkdown(quote)}
        </blockquote>
      );
    }

    // Unordered list (check for lines starting with * or -)
    if (/^[\*\-] /.test(trimmed)) {
      const items = trimmed.split("\n").filter((line) => /^[\*\-] /.test(line.trim()));
      return (
        <ul key={index} className="list-disc list-inside space-y-2 my-6 text-stone-600">
          {items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {parseInlineMarkdown(item.replace(/^[\*\-] /, ""))}
            </li>
          ))}
        </ul>
      );
    }

    // Ordered list
    if (/^\d+\. /.test(trimmed)) {
      const items = trimmed.split("\n").filter((line) => /^\d+\. /.test(line.trim()));
      return (
        <ol key={index} className="list-decimal list-inside space-y-2 my-6 text-stone-600">
          {items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {parseInlineMarkdown(item.replace(/^\d+\. /, ""))}
            </li>
          ))}
        </ol>
      );
    }

    // Image only block
    if (/^!\[.*\]\(.*\)$/.test(trimmed)) {
      // Match is guaranteed by the test above, using non-null assertion
      const match = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)!;
      return (
        <figure key={index} className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={match[2]}
            alt={match[1]}
            className="max-w-full rounded-lg mx-auto"
          />
          {match[1] && (
            <figcaption className="text-center text-sm text-stone-400 mt-3">
              {match[1]}
            </figcaption>
          )}
        </figure>
      );
    }

    // Regular paragraph
    return (
      <p key={index} className="text-stone-600 leading-relaxed mb-6">
        {parseInlineMarkdown(trimmed)}
      </p>
    );
  };

  // Split by double newlines and handle each block
  const blocks = content.split(/\n\n+/);

  return <div className={className}>{blocks.map((block, index) => parseBlock(block, index))}</div>;
}
