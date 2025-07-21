import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getPostBySlug, getAllPostSlugs, formatDate } from "@/lib/blog";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug);

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

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto">
      {/* Back to Blog */}
      <Link
        href="/blog"
        className="text-gray-400 hover:text-white mb-8 inline-block transition-colors"
      >
        ← Back to Posts
      </Link>

      {/* Post Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-white">{post.title}</h1>
        <div className="text-gray-400 text-sm mb-4">
          {formatDate(post.date)} • {post.readTime}
        </div>
        <p className="text-gray-300 text-lg leading-relaxed">
          {post.description}
        </p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Post Content */}
      <div className="text-gray-300">
        <MarkdownRenderer content={post.content} />
      </div>

      {/* Post Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-800">
        <div className="flex justify-between items-center">
          <Link
            href="/blog"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Posts
          </Link>
          <div className="text-sm text-gray-500">By {post.author}</div>
        </div>
      </footer>
    </article>
  );
}
