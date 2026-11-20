import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPostBySlug, getAllPostSlugs, formatDate } from "@/lib/blog";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { A, INK, InkRule } from "@/components/InkPage";

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
    <article className="mx-auto w-full max-w-[40rem] text-[1.125rem] leading-[1.7]">
      <header className="mb-10 space-y-4" style={{ filter: "url(#ink-text)" }}>
        <p className="text-[1rem]">
          <A href="/">← raghav tirumale</A>
        </p>
        <h1 className="text-[2.25rem] font-medium leading-[1.15] [text-wrap:balance]" style={{ color: INK }}>
          {post.title.toLowerCase()}
        </h1>
        <p className="text-[1rem] italic">
          {formatDate(post.date)} · {post.readTime}
        </p>
      </header>

      <InkRule seed={804} />

      <div className="mt-10">
        <MarkdownRenderer content={post.content} />
      </div>

      <footer className="mt-16 space-y-4 text-[1rem]">
        <InkRule seed={805} />
        <p>
          <A href="/">← raghav tirumale</A>
        </p>
      </footer>
    </article>
  );
}
