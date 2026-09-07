import type { ReactNode } from "react";
import MeditationSculpture from "@/components/MeditationSculpture";

const links = {
  tjhsst: "https://www.tjhsst.edu/",
  uiuc: "https://illinois.edu/",
  khoj: "https://khoj.dev/",
  guardianRf: "https://www.guardianrf.com/",
  deepgrove: "https://www.deepgrove.com/",
  anduril: "https://www.anduril.com/",
  saronic: "https://www.saronic.com/",
  epirus: "https://www.epirusinc.com/",
  cx2: "https://www.cx2.com/",
  eightVc: "https://www.8vc.com/",
  sequoia: "https://www.sequoiacap.com/",
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
      <section className="grid min-h-screen px-8 pb-20 pt-32 md:px-16 md:pb-28 md:pt-40 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.85fr)] lg:grid-rows-[auto_auto] lg:content-center lg:gap-x-14">
        <header className="mb-9 lg:col-start-1 lg:row-start-1 lg:mb-12">
          <h1 className="text-2xl font-medium tracking-[-0.02em] text-[var(--ink)] lowercase">
            raghav tirumale
          </h1>
        </header>

        <MeditationSculpture
          className="animate-fadeUp-delay2 mb-12 h-[330px] sm:h-[390px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mb-0 lg:h-[min(70vh,650px)] lg:self-center"
        />

        <div className="animate-fadeUp-delay max-w-[64ch] space-y-5 text-[1.05rem] leading-[1.75] text-[var(--body)] lg:col-start-1 lg:row-start-2">
          <p>
            i went to <Keyword href={links.tjhsst}>tjhsst</Keyword> for high school, where i built things alongside really strong peers. we built a 6 ft tall humanoid that got far enough to move a leg and balance in sim, and a real time voice ai, a primitive harness on top of existing models.
          </p>
          <p>
            i studied computer engineering at <Keyword href={links.uiuc}>uiuc</Keyword> and finished in three years, most of it spent inside startups: applied ai at <Keyword href={links.khoj}>khoj</Keyword> (<Keyword href={links.yCombinator}>yc</Keyword> s23), rf and drone tracking at <Keyword href={links.guardianRf}>guardian rf</Keyword> (<Keyword href={links.yCombinator}>yc</Keyword> s24), low bit inference at <Keyword href={links.deepgrove}>deepgrove</Keyword> (<Keyword href={links.yCombinator}>yc</Keyword> s25), with grad classes on manycore parallel algorithms and machine learning systems in between.
          </p>
          <p>
            i&apos;m most interested in defense, robotics, space, manufacturing, and longevity tech, the places where software meets atoms under real stakes, and companies like <Keyword href={links.anduril}>anduril</Keyword>, <Keyword href={links.saronic}>saronic</Keyword>, <Keyword href={links.epirus}>epirus</Keyword>, and <Keyword href={links.cx2}>cx2</Keyword>. being an <Keyword href={links.eightVc}>8vc fellow</Keyword> let me get closer to the companies i care about.
          </p>
          <p>
            {/* after start date: "i'll be joining anduril shortly to work on" → "i work at anduril on" */}
            i&apos;ll be joining <Keyword href={links.anduril}>anduril</Keyword> shortly to work on the hardest problems along that thesis.
          </p>
          <p>
            outside that i meditate, train, cook, drink tea, and have long conversations with friends.
          </p>
          <p className="pt-1 text-[var(--dim)]">
            tirumale [dot] raghav [at] gmail [dot] com
          </p>
        </div>
      </section>
    </main>
  );
}
