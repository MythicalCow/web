import { A, GREEN, INK, InkShell, Mono, Rule } from "@/components/InkPage";
import MeditationDrawing from "@/components/MeditationDrawing";
import { getAllPosts } from "@/lib/blog";

const links = {
  anduril: "https://www.anduril.com/",
  deepgrove: "https://deepgrove.ai/",
  guardianRf: "https://www.guardianrf.com/",
  uiuc: "https://illinois.edu/",
  eightVc: "https://www.8vc.com/",
  khoj: "https://khoj.dev/",
};

const socials = [
  { label: "twitter", href: "https://x.com/raghav_tiru" },
  { label: "github", href: "https://github.com/MythicalCow" },
];

const shortTitles: Record<string, string> = {
  "maple-inference": "running a 20b llm on a mac mini",
  "making-reactive-diffusion-systems-faster": "faster reaction-diffusion in triton",
  "inferencing-transformers-in-real-time": "real-time transformer inference in cuda",
};

export default function Home() {
  const posts = getAllPosts();

  return (
    <InkShell>
      <main className="flex min-h-screen items-center px-6 py-14 md:px-14 md:py-20">
        <article className="mx-auto w-full max-w-[40rem]">
          {/* the one textured thing: a small two-colour woodcut, gently moving */}
          <div className="mx-auto mb-12 w-[190px] sm:w-[220px]" style={{ filter: "url(#ink-press-solid)" }}>
            <MeditationDrawing foliage={GREEN} animated />
          </div>

          <div className="space-y-10 text-[1.125rem] sm:text-[1.25rem] leading-[1.6]">
            <header className="space-y-5">
              <h1 className="text-[2.25rem] sm:text-[2.5rem] font-normal leading-[1.1] tracking-[-0.02em]" style={{ color: INK }}>
                raghav tirumale
              </h1>
              <div className="space-y-3 [text-wrap:pretty]">
                <p>
                  i currently work on machine learning at <A href={links.anduril} className="whitespace-nowrap">anduril</A>.
                </p>
                <p>
                  previously i was an <A href={links.eightVc} className="whitespace-nowrap">8vc fellow</A>, led inference at{" "}
                  <A href={links.deepgrove} className="whitespace-nowrap">deepgrove</A> <span className="whitespace-nowrap">(yc s25)</span>, worked on drone
                  detection at <A href={links.guardianRf} className="whitespace-nowrap">guardian rf</A>{" "}
                  <span className="whitespace-nowrap">(yc s24)</span>, and applied ai at <A href={links.khoj} className="whitespace-nowrap">khoj</A>{" "}
                  <span className="whitespace-nowrap">(yc s23)</span>.
                </p>
                <p>
                  i studied computer engineering at <A href={links.uiuc}>uiuc</A> with a focus on systems, parallel computing, and machine learning.
                </p>
                <p className="italic">other interests: meditation, drinking tea, cooking, spending time in nature.</p>
              </div>
            </header>

            {/* writing: date + title rows */}
            <section className="space-y-4">
              <Rule />
              <Mono>technical</Mono>
              <ul className="space-y-2">
                {posts.map((post) => (
                  <li key={post.slug} className="grid grid-cols-[7.5rem_1fr] items-baseline gap-x-3">
                    <Mono>{post.date.slice(0, 10)}</Mono>
                    <A href={post.external ?? `/blog/${post.slug}`} className="justify-self-start">
                      {shortTitles[post.slug] ?? post.title}
                    </A>
                  </li>
                ))}
              </ul>
            </section>

            {/* contact */}
            <footer className="space-y-4">
              <Rule />
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                {socials.map(({ label, href }) => (
                  <A key={label} href={href}>
                    {label}
                  </A>
                ))}
              </div>
              <Mono>tirumale [dot] raghav [at] gmail [dot] com</Mono>
            </footer>
          </div>
        </article>
      </main>
    </InkShell>
  );
}
