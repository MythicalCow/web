import { A, INK, InkRule } from "@/components/InkPage";
import { formatDate, getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Writing",
  description: "Notes on GPU kernels, processor design, and making machine intelligence run fast.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto w-full max-w-[36rem] space-y-10 text-[1.125rem] leading-[1.65]">
      <header className="space-y-4" style={{ filter: "url(#ink-text)" }}>
        <p className="text-[1rem]">
          <A href="/">← raghav tirumale</A>
        </p>
        <h1 className="text-[2.25rem] font-medium leading-[1.1]" style={{ color: INK }}>
          writing
        </h1>
      </header>

      <InkRule seed={803} />

      {posts.length > 0 ? (
        <ul className="space-y-8">
          {posts.map((post) => (
            <li key={post.slug} className="space-y-1">
              <p>
                <A href={post.external ?? `/blog/${post.slug}`}>{post.title.toLowerCase()}</A>
              </p>
              <p className="text-[1rem] italic">
                {formatDate(post.date)} · {post.readTime}
                {post.external && ` · on ${post.externalSource || "the web"}`}
              </p>
              <p>{post.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="italic">nothing here yet.</p>
      )}
    </div>
  );
}
