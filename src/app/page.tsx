import type { ReactNode } from "react";
import MeditationSculpture from "@/components/MeditationSculpture";

const links = {
  tjhsst: "https://www.tjhsst.edu/",
  uiuc: "https://illinois.edu/",
  khoj: "https://khoj.dev/",
  guardianRf: "https://www.guardianrf.com/",
  deepgrove: "https://www.deepgrove.com/",
  anduril: "https://www.anduril.com/",
  eightVc: "https://www.8vc.com/",
  yCombinator: "https://www.ycombinator.com/",
};

function Keyword({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      className="font-medium text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export default function Home() {
  return (
    <main className="home-page min-h-screen bg-[var(--bg)] selection:bg-[var(--ink)] selection:text-[var(--bg)]">
      <section className="grid min-h-screen px-8 pb-16 pt-32 md:px-16 md:pb-20 md:pt-40 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.85fr)] lg:items-start lg:content-center lg:gap-x-14">
        <div className="contents lg:col-start-1 lg:block">
          <header className="order-1 mb-8 lg:order-none lg:mb-10">
            <h1 className="text-2xl font-medium tracking-[-0.02em] text-[var(--ink)] lowercase">
              raghav tirumale
            </h1>
          </header>

          <div className="order-3 max-w-[64ch] space-y-4 text-[1.05rem] leading-[1.7] text-[var(--body)] animate-fadeUp-delay lg:order-none">
          <p>
            i work on ml at <Keyword href={links.anduril}>anduril</Keyword>.
          </p>
          <p>
            i&apos;ve wanted to build robots since i was a kid. at <Keyword href={links.tjhsst}>tjhsst</Keyword>, i attempted humanoids with friends and built a voice agent inspired by baymax for research.
          </p>
          <p>
            i finished computer engineering at <Keyword href={links.uiuc}>uiuc</Keyword> in three years, with grad classes in manycore parallel algorithms and systems for generative ai. while there, i worked on applied ai at <Keyword href={links.khoj}>khoj</Keyword> (<Keyword href={links.yCombinator}>yc</Keyword> s23), built drone detection from raw rf at <Keyword href={links.guardianRf}>guardian rf</Keyword> (<Keyword href={links.yCombinator}>yc</Keyword> s24), and led inference at <Keyword href={links.deepgrove}>deepgrove</Keyword> (<Keyword href={links.yCombinator}>yc</Keyword> s25), pushing a frontier 20b parameter model past 200 tokens per second on commodity hardware.
          </p>
          <p>
            i care most about machine intelligence and how to make it more reliable, performant, and widespread. as an <Keyword href={links.eightVc}>8vc fellow</Keyword>, i got a chance to hear from founders of some of the most ambitious companies.
          </p>
          <p>
            outside work, i meditate, train, cook, drink tea, have long conversations with friends, and occasionally write.
          </p>
            <p className="pt-1 text-[var(--dim)]">
              tirumale [dot] raghav [at] gmail [dot] com
            </p>
          </div>
        </div>

        <MeditationSculpture
          className="animate-fadeUp-delay2 order-2 mb-8 h-[330px] sm:h-[390px] lg:order-none lg:col-start-2 lg:row-start-1 lg:mb-0 lg:h-[min(70vh,650px)] lg:self-center"
        />
      </section>
    </main>
  );
}
