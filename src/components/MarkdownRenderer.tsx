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
    <div className="prose prose-lg max-w-none text-[var(--body-prose)]">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-5 mt-12 text-3xl font-medium tracking-[-0.02em] text-[var(--ink)] first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-4 mt-12 text-2xl font-medium tracking-[-0.02em] text-[var(--ink)]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-9 text-xl font-medium text-[var(--ink)]">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-7 text-lg font-medium text-[var(--ink)]">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-5 leading-[1.75] text-[var(--body-prose)]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-5 ml-6 list-disc space-y-1 text-[var(--body-prose)] marker:text-[var(--copper-dim)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-5 ml-6 list-decimal space-y-1 text-[var(--body-prose)] marker:text-[var(--copper-dim)]">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !className;

            return !isInline && match ? (
              <div className="my-7">
                <pre className="overflow-x-auto border border-[var(--line)] bg-[var(--surface)] p-5">
                  <code
                    className={`language-${match[1]} font-mono text-sm text-[var(--ink-soft)]`}
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </code>
                </pre>
              </div>
            ) : (
              <code
                className="border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--ink-soft)]"
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="my-7 border-l-2 border-[var(--copper-dim)] pl-5 text-[var(--body)]">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-7 overflow-x-auto">
              <table className="min-w-full border-collapse border border-[var(--line)]">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-left font-medium text-[var(--ink-soft)]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[var(--line)] px-4 py-2 text-[var(--body-prose)]">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-[var(--ink-soft)] underline decoration-[var(--copper-dim)] decoration-[1px] underline-offset-2 transition-colors hover:text-[var(--ink)] hover:decoration-[var(--copper)]"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <span className="my-9 block">
              <Image
                src={src || ""}
                alt={alt || ""}
                width={800}
                height={600}
                className="mx-auto h-auto max-w-full border border-[var(--line)] bg-[var(--surface)]"
                style={{ width: "auto", height: "auto" }}
              />
            </span>
          ),
          hr: () => <hr className="my-12 border-[var(--line)]" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--ink-soft)]">
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
