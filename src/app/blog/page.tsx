import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/blog";

export const metadata = {
  title: "Blog",
  description: "My personal blog with thoughts on technology and development",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="space-y-8">
      {/* Blog Posts List */}
      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-gray-800 pb-6 last:border-b-0"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white hover:text-gray-300 transition-colors">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <div className="text-gray-400 text-sm">
                  {formatDate(post.date)} • {post.readTime}
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {post.description}
                </p>
              </div>
            </article>
          ))
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-400">Check back later for new content.</p>
          </div>
        )}
      </div>
    </div>
  );
}
