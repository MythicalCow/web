import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getPostBySlug, getAllPostSlugs, formatDate } from "@/lib/blog";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({
    slug: slug,
  }));
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-[70ch]">
      <Link
        href="/blog"
        className="utility text-link mb-12 inline-block text-[var(--dim)]"
      >
        ← writing
      </Link>

      <header className="mb-12 border-b border-[var(--line)] pb-10">
        <h1 className="text-3xl sm:text-4xl font-medium tracking-[-0.02em] leading-tight mb-4 text-[var(--ink)]">
          {post.title}
        </h1>
        <div className="utility text-[var(--dim)]">
          {formatDate(post.date)} · {post.readTime} · {post.author}
        </div>
      </header>

      <MarkdownRenderer content={post.content} />

      <footer className="mt-16 pt-8">
        <Link
          href="/blog"
          className="utility text-link text-[var(--dim)]"
        >
          ← writing
        </Link>
      </footer>
    </article>
  );
}
