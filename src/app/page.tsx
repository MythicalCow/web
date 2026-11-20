import { EB_Garamond } from "next/font/google";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import InkFilters from "@/components/InkFilters";
import MeditationDrawing, { brush } from "@/components/MeditationDrawing";
import { getAllPosts } from "@/lib/blog";

const garamond = EB_Garamond({ weight: ["400", "500"], style: ["normal", "italic"], subsets: ["latin"] });

const PAPER = "#ece6d6";
const INK = "#1c1a17";
const BODY = "#24211c"; // one ink tone for all running text
const GREEN = "#3f6a45";

const links = {
  anduril: "https://www.anduril.com/",
  deepgrove: "https://deepgrove.ai/",
  guardianRf: "https://www.guardianrf.com/",
  uiuc: "https://illinois.edu/",
  eightVc: "https://www.8vc.com/",
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

const linkStyle: CSSProperties = {
  textDecoration: "underline",
  textDecorationThickness: "1px",
  textUnderlineOffset: "0.22em",
  textDecorationColor: GREEN,
};

function A({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  const cls = `transition-opacity hover:opacity-60 ${className}`;
  return href.startsWith("http") ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={linkStyle}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls} style={linkStyle}>
      {children}
    </Link>
  );
}

/* A hand-inked rule: one brush stroke that swells and thins, instead of a CSS border. */
function InkRule({ seed }: { seed: number }) {
  return (
    <svg viewBox="0 0 1000 10" preserveAspectRatio="none" className="block h-[7px] w-full" aria-hidden>
      <path d={brush([[2, 5.5], [250, 4.6], [520, 5.6], [780, 4.8], [998, 5.2]], 2.4, { seed, start: 0.35, end: 0.05, wobble: 0.25 })} fill={INK} opacity={0.4} />
    </svg>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[1rem] italic tracking-[0.01em]" style={{ color: GREEN }}>
      {children}
    </p>
  );
}

export default function Home() {
  const posts = getAllPosts();

  return (
    <main
      className={`relative flex min-h-screen items-center px-6 py-12 md:px-14 md:py-16 ${garamond.className}`}
      style={{ background: PAPER, color: INK, ["--paper" as string]: PAPER }}
    >
      <style>{`html,body{background:${PAPER}}`}</style>
      <InkFilters />

      {/* newsprint grain */}
      <svg className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden style={{ mixBlendMode: "multiply", opacity: 0.45 }}>
        <rect width="100%" height="100%" filter="url(#paper-grain)" />
      </svg>

      {/* type scale: display 2.25rem · body 1.125rem · small 1rem — nothing else */}
      <article className="relative mx-auto w-full max-w-[36rem]">
        {/* a small woodcut: black key plate, green foliage plate, gently moving */}
        <div className="mx-auto mb-10 w-[180px] sm:w-[210px]" style={{ filter: "url(#ink-press-solid)" }}>
          <MeditationDrawing foliage={GREEN} animated />
        </div>

        <div className="space-y-10 text-[1.125rem] leading-[1.65]" style={{ filter: "url(#ink-text)", color: BODY }}>
          <header className="space-y-4">
            <h1 className="text-[2.25rem] font-medium leading-[1.1]" style={{ color: INK }}>
              raghav tirumale
            </h1>
            <div className="space-y-3 [text-wrap:pretty]">
              <p>
                i currently work on machine learning at <A href={links.anduril} className="whitespace-nowrap">anduril</A>.
              </p>
              <p>
                previously i led inference at <A href={links.deepgrove} className="whitespace-nowrap">deepgrove</A>, worked on drone detection at{" "}
                <A href={links.guardianRf} className="whitespace-nowrap">guardian rf</A>, and was an{" "}
                <A href={links.eightVc} className="whitespace-nowrap">8vc fellow</A>.
              </p>
              <p>
                i studied computer engineering at the <A href={links.uiuc} className="whitespace-nowrap">university of illinois</A>.
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
  );
}
