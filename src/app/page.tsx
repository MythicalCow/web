import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

const links = {
  anduril: "https://www.anduril.com/",
  uiuc: "https://illinois.edu/",
  deepgrove: "https://deepgrove.ai/",
  guardianRf: "https://www.guardianrf.com/",
  khoj: "https://khoj.dev/",
  eightVc: "https://www.8vc.com/",
};

const selectedWork = [
  {
    name: "maple inference",
    href: "https://deepgrove.ai/maple-inference",
    detail: "running a 20b language model at 218 tokens/sec on a mac mini",
  },
  {
    name: "leosim",
    href: "https://github.com/MythicalCow/leosim",
    detail: "simulating low-earth-orbit satellite networks, from propagation to routing",
  },
  {
    name: "superscalar risc-v",
    href: "https://github.com/MythicalCow/web/blob/main/superscalar/ECE411FinalReport.html",
    detail: "a two-way out-of-order processor with register renaming and pipelined caches",
  },
];

const linkStyle =
  "font-medium text-[var(--ink)] underline decoration-[var(--line)] underline-offset-[3px] transition-colors hover:decoration-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]";

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a className={linkStyle} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mb-4 text-[1.02rem] font-medium tracking-[-0.01em] text-[var(--ink)]"
    >
      {children}
    </h2>
  );
}

export default function Home() {
  const posts = getAllPosts();

  return (
    <main className="home-page min-h-screen bg-[var(--bg)] px-7 pb-24 pt-32 selection:bg-[var(--ink)] selection:text-[var(--bg)] sm:px-10 md:pt-36">
      <div className="mx-auto max-w-[680px]">
        <header className="mb-10">
          <h1 className="text-[1.55rem] font-medium tracking-[-0.025em] text-[var(--ink)]">
            raghav tirumale
          </h1>
        </header>

        <section aria-labelledby="intro" className="text-[1rem] leading-[1.75] text-[var(--ink-soft)]">
          <SectionHeading id="intro">hi</SectionHeading>
          <div className="space-y-4">
            <p>
              i work on ml at <ExternalLink href={links.anduril}>anduril</ExternalLink>,
              where perception, autonomy, and systems meet.
            </p>
            <p>
              before that, i led inference at{" "}
              <ExternalLink href={links.deepgrove}>deepgrove</ExternalLink> (yc s25),
              worked on rf sensing at{" "}
              <ExternalLink href={links.guardianRf}>guardian rf</ExternalLink> (yc s24),
              and applied ai at <ExternalLink href={links.khoj}>khoj</ExternalLink> (yc s23).
              i studied computer engineering at{" "}
              <ExternalLink href={links.uiuc}>uiuc</ExternalLink>, finishing in three years.
            </p>
            <p>
              i&apos;ve wanted to build robots since i was a kid. these days,
              i&apos;m most interested in how we make machine intelligence
              more capable, efficient, and useful on real machines.
            </p>
          </div>
        </section>

        <section aria-labelledby="work" className="mt-11">
          <SectionHeading id="work">things i&apos;ve built</SectionHeading>
          <ul className="list-disc space-y-2 pl-5 text-[1rem] leading-[1.7] text-[var(--ink-soft)] marker:text-[var(--dim)]">
            {selectedWork.map((item) => (
              <li key={item.name} className="pl-1">
                <ExternalLink href={item.href}>{item.name}</ExternalLink>
                {" — "}{item.detail}
              </li>
            ))}
          </ul>
        </section>

        {posts.length > 0 && (
          <section aria-labelledby="writing" className="mt-11">
            <SectionHeading id="writing">sometimes i write</SectionHeading>
            <ul className="list-disc space-y-2 pl-5 text-[1rem] leading-[1.7] text-[var(--ink-soft)] marker:text-[var(--dim)]">
              {posts.map((post) => (
                <li key={post.slug} className="pl-1">
                  {post.external ? (
                    <ExternalLink href={post.external}>
                      {post.title.toLowerCase()}
                    </ExternalLink>
                  ) : (
                    <Link className={linkStyle} href={`/blog/${post.slug}`}>
                      {post.title.toLowerCase()}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 pl-6 text-sm text-[var(--body)]">
              <Link className={linkStyle} href="/blog">
                all writing
              </Link>
            </p>
          </section>
        )}

        <section aria-labelledby="misc" className="mt-11">
          <SectionHeading id="misc">misc</SectionHeading>
          <div className="space-y-3 text-[1rem] leading-[1.75] text-[var(--ink-soft)]">
            <p>
              i&apos;m an <ExternalLink href={links.eightVc}>8vc engineering fellow</ExternalLink>.
              outside of computers, i meditate, lift, cook, listen to music,
              and spend time with friends.
            </p>
            <p>
              say hi: <span className="text-[var(--body)]">tirumale [dot] raghav [at] gmail [dot] com</span>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
