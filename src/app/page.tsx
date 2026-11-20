import { A, GREEN, INK, InkRule, InkShell, Label } from "@/components/InkPage";
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
    <main className="flex min-h-screen items-center px-6 py-12 md:px-14 md:py-16">
      {/* type scale: display 2.25rem · body 1.125rem · small 1rem — nothing else */}
      <article className="relative mx-auto w-full max-w-[36rem]">
        {/* a small woodcut: black key plate, green foliage plate, gently moving */}
        <div className="mx-auto mb-10 w-[180px] sm:w-[210px]" style={{ filter: "url(#ink-press-solid)" }}>
          <MeditationDrawing foliage={GREEN} animated />
        </div>

        <div className="space-y-10 text-[1.125rem] leading-[1.65]" style={{ filter: "url(#ink-text)" }}>
          <header className="space-y-4">
            <h1 className="text-[2.25rem] font-medium leading-[1.1]" style={{ color: INK }}>
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
              <p className="italic">
                other interests: meditation, drinking tea, cooking, spending time in nature.
              </p>
            </div>
          </header>

          {/* writing */}
          <section className="space-y-4">
            <InkRule seed={801} />
            <div className="space-y-2">
              <Label>technical</Label>
              <ul className="space-y-1.5">
                {posts.map((post) => (
                  <li key={post.slug}>
                    <A href={post.external ?? `/blog/${post.slug}`}>{shortTitles[post.slug] ?? post.title}</A>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* contact */}
          <footer className="space-y-4">
            <InkRule seed={802} />
            <div className="space-y-1">
              <p className="flex flex-wrap gap-x-5">
                {socials.map(({ label, href }) => (
                  <A key={label} href={href}>
                    {label}
                  </A>
                ))}
              </p>
              <p className="text-[1rem]">
                tirumale [dot] raghav [at] gmail [dot] com
              </p>
            </div>
          </footer>
        </div>
      </article>
    </main>
    </InkShell>
  );
}
