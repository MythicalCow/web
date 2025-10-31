import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/blog";

export const metadata = {
  title: "Blog",
  description: "My personal blog with thoughts on technology and development",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="space-y-12">
      {/* Blog Posts List */}
      <div className="space-y-10">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-gray-100 pb-10 last:border-b-0"
            >
              <div className="space-y-3">
                <h2 className="text-xl font-medium text-[#282828] hover:text-gray-600 transition-colors">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <div className="text-gray-500 text-sm">
                  {formatDate(post.date)} • {post.readTime}
                </div>
                <p className="text-gray-600 leading-relaxed text-base">
                  {post.description}
                </p>
              </div>
            </article>
          ))
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-[#282828] mb-2">
              No posts yet
            </h3>
            <p className="text-gray-500 text-sm">Check back later for new content.</p>
          </div>
        )}
      </div>
    </div>
  );
}
