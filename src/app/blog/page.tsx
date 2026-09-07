import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/blog";
import LineSculpture from "@/components/LineSculpture";

export const metadata = {
  title: "Writing",
  description:
    "Notes on GPU kernels, processor design, and making machine intelligence run fast.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.68fr)] lg:gap-x-20">
      <h1 className="sr-only">writing</h1>

      <LineSculpture
        variant="palm"
        interactive
        className="mb-12 h-[270px] sm:h-[330px] lg:col-start-2 lg:row-start-1 lg:mb-0 lg:h-[470px]"
      />

      <div className="lg:col-start-1 lg:row-start-1">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article
              key={post.slug}
              className="border-t border-[var(--line)] py-8 first:border-t-0 first:pt-0 last:pb-0"
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
                  {post.external && ` · on ${post.externalSource || "the web"}`}
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
