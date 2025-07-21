"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Headers
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mt-8 mb-4 first:mt-0 text-white">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold mt-6 mb-3 text-white">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-bold mt-4 mb-2 text-white">
              {children}
            </h3>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-gray-300">
              {children}
            </p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 list-disc text-gray-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 list-decimal text-gray-300">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="mb-1 text-gray-300">
              {children}
            </li>
          ),

          // Code blocks
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="my-4">
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-200"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-400 bg-gray-900/50 py-2">
              {children}
            </blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-700">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-700 px-4 py-2 bg-gray-800 text-left text-white font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-700 px-4 py-2 text-gray-300">
              {children}
            </td>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),

          // Images
          img: ({ src, alt }) => (
            <div className="my-6 text-center">
              <img
                src={src}
                alt={alt}
                className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
              />
              {alt && (
                <p className="text-sm text-gray-500 mt-2 italic">{alt}</p>
              )}
            </div>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="my-8 border-gray-700" />
          ),

          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-bold text-white">
              {children}
            </strong>
          ),

          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic text-gray-200">
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
