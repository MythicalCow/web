import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPostBySlug, getAllPostSlugs } from "@/lib/blog";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { A, INK, Mono, Rule } from "@/components/InkPage";

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
    <article className="mx-auto w-full max-w-[44rem] text-[1.125rem] sm:text-[1.25rem] leading-[1.7]">
      <header className="mb-10 space-y-5">
        <Mono>
          <A href="/">← raghav tirumale</A>
        </Mono>
        <h1 className="text-[2.25rem] sm:text-[2.5rem] font-normal leading-[1.15] tracking-[-0.02em] [text-wrap:balance]" style={{ color: INK }}>
          {post.title.toLowerCase()}
        </h1>
        <Mono>
          {post.date} · {post.readTime}
        </Mono>
      </header>

      <Rule />

      <div className="mt-10">
        <MarkdownRenderer content={post.content} />
      </div>

      <footer className="mt-16 space-y-4">
        <Rule />
        <Mono>
          <A href="/">← raghav tirumale</A>
        </Mono>
      </footer>
    </article>
  );
}
