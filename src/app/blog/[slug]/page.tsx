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
    <div className="min-h-screen bg-white text-[#282828]">
      <article className="max-w-4xl mx-auto px-6 py-32">
        {/* Back to Blog */}
        <Link
          href="/blog"
          className="text-gray-500 hover:text-[#282828] mb-12 inline-block text-sm transition-colors"
        >
          ← Back to Posts
        </Link>

        {/* Post Header */}
        <header className="mb-12">
          <h1 className="text-2xl font-medium mb-4 text-[#282828]">{post.title}</h1>
          <div className="text-gray-500 text-sm mb-6">
            {formatDate(post.date)} • {post.readTime}
          </div>
          <p className="text-gray-600 text-base leading-relaxed">
            {post.description}
          </p>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Post Content */}
        <div className="text-[#282828]">
          <MarkdownRenderer content={post.content} />
        </div>

        {/* Post Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <Link
              href="/blog"
              className="text-gray-500 hover:text-[#282828] transition-colors text-sm"
            >
              ← Back to Posts
            </Link>
            <div className="text-xs text-gray-400">By {post.author}</div>
          </div>
        </footer>
      </article>
    </div>
  );
}
