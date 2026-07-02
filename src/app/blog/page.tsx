import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/blog";

export const metadata = {
  title: "Writing",
  description:
    "Notes on GPU kernels, processor design, and making machine intelligence run fast.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-2xl font-medium tracking-[-0.02em] text-[var(--ink)] lowercase">
          writing
        </h1>
      </header>

      <div className="space-y-10">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article
              key={post.slug}
              className="pb-10"
            >
              <div className="space-y-3">
                <h2 className="text-lg font-medium">
                  {post.external ? (
                    <a className="text-link" href={post.external} target="_blank" rel="noopener noreferrer">
                      {post.title} <span className="external-arrow" aria-hidden>↗</span>
                    </a>
                  ) : (
                    <Link className="text-link" href={`/blog/${post.slug}`}>{post.title}</Link>
                  )}
                </h2>
                <div className="utility text-[var(--dim)]">
                  {formatDate(post.date)} · {post.readTime}
                  {post.external && " · on Substack"}
                </div>
                <p className="text-sm leading-relaxed text-[var(--body)]">
                  {post.description}
                </p>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-[var(--dim)]">nothing here yet.</p>
        )}
      </div>
    </div>
  );
}
