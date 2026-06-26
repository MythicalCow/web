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
          h1: ({ children }) => (
            <h1 className="text-3xl font-medium tracking-tight mt-12 mb-5 first:mt-0 text-[#e8e8e8]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-medium tracking-tight mt-10 mb-4 text-[#e8e8e8]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-medium mt-8 mb-3 text-[#e8e8e8]">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-medium mt-6 mb-2 text-[#e8e8e8]">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-5 leading-relaxed text-[#787878]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-5 ml-6 list-disc text-[#787878] space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-5 ml-6 list-decimal text-[#787878] space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !className;

            return !isInline && match ? (
              <div className="my-6">
                <pre className="bg-[#111] border border-[#1e1e1e] p-4 rounded-lg overflow-x-auto">
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
                className="bg-[#161616] border border-[#1e1e1e] px-1.5 py-0.5 rounded text-[0.9em] font-mono text-[#c8c8c8]"
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#2a2a2a] pl-4 my-6 text-[#585858]">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border-collapse border border-[#1e1e1e]">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-[#1e1e1e] px-4 py-2 bg-[#111] text-left text-[#c8c8c8] font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[#1e1e1e] px-4 py-2 text-[#787878]">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-[#c8c8c8] underline decoration-[#3a3a3a] decoration-[1px] underline-offset-2 hover:decoration-[#787878] transition-colors"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <figure className="my-8">
              <Image
                src={src || ""}
                alt={alt || ""}
                width={800}
                height={600}
                className="max-w-full h-auto mx-auto rounded-md"
                style={{ width: "auto", height: "auto" }}
              />
            </figure>
          ),
          hr: () => <hr className="my-10 border-[#1e1e1e]" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-[#e8e8e8]">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
