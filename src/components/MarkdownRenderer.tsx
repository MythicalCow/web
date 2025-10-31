"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import Image from "next/image";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Headers
          h1: ({ children }) => (
            <h1 className="text-3xl font-semibold mt-8 mb-4 first:mt-0 text-[#282828]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold mt-6 mb-3 text-[#282828]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold mt-4 mb-2 text-[#282828]">
              {children}
            </h3>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-[#282828]">{children}</p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 list-disc text-[#282828]">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 list-decimal text-[#282828]">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="mb-1 text-[#282828]">{children}</li>
          ),

          // Code blocks
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !className;

            return !isInline && match ? (
              <div className="my-4">
                <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                  <code
                    className={`language-${match[1]} text-gray-100 text-sm font-mono`}
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </code>
                </pre>
              </div>
            ) : (
              <code
                className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-[#282828] border border-gray-200"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-600 pl-4 my-4 italic text-gray-600 bg-blue-50 py-2 rounded-r">
              {children}
            </blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left text-[#282828] font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-4 py-2 text-[#282828]">
              {children}
            </td>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-700 underline transition-colors"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),

          // Images
          img: ({ src, alt }) => (
            <div className="my-6 text-center">
              <Image
                src={src || ""}
                alt={alt || ""}
                width={800}
                height={600}
                className="max-w-full h-auto mx-auto rounded-lg shadow-md"
                style={{ width: "auto", height: "auto" }}
              />
            </div>
          ),

          // Horizontal rule
          hr: () => <hr className="my-8 border-gray-300" />,

          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-[#282828]">{children}</strong>
          ),

          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic text-[#282828]">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
