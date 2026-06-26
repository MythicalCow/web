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
        <h1 className="text-2xl font-medium tracking-tight text-[#e8e8e8] lowercase">
          writing
        </h1>
      </header>

      <div className="space-y-10">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-[#161616] pb-10 last:border-b-0"
            >
              <div className="space-y-3">
                <h2 className="text-lg font-medium text-[#c8c8c8] hover:text-[#e8e8e8] transition-colors">
                  {post.external ? (
                    <a href={post.external} target="_blank" rel="noopener noreferrer">
                      {post.title} <span aria-hidden>↗</span>
                    </a>
                  ) : (
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  )}
                </h2>
                <div className="text-[#484848] text-sm">
                  {formatDate(post.date)} · {post.readTime}
                  {post.external && " · on Substack"}
                </div>
                <p className="text-[#787878] leading-relaxed text-sm">
                  {post.description}
                </p>
              </div>
            </article>
          ))
        ) : (
          <p className="text-[#484848] text-sm">nothing here yet.</p>
        )}
      </div>
    </div>
  );
}
