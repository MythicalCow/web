import { A, INK, Mono, Rule } from "@/components/InkPage";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Writing",
  description: "Notes on GPU kernels, processor design, and making machine intelligence run fast.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto w-full max-w-[40rem] space-y-8 text-[1.125rem] sm:text-[1.25rem] leading-[1.6]">
      <header className="space-y-5">
        <Mono>
          <A href="/">← raghav tirumale</A>
        </Mono>
        <h1 className="text-[2.25rem] sm:text-[2.5rem] font-normal leading-[1.1] tracking-[-0.02em]" style={{ color: INK }}>
          writing
        </h1>
      </header>

      <Rule />

      {posts.length > 0 ? (
        <ul className="space-y-8">
          {posts.map((post) => (
            <li key={post.slug} className="space-y-1.5">
              <Mono>
                {post.date} · {post.readTime}
                {post.external && ` · on ${(post.externalSource || "the web").toLowerCase()}`}
              </Mono>
              <p>
                <A href={post.external ?? `/blog/${post.slug}`}>{post.title.toLowerCase()}</A>
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
