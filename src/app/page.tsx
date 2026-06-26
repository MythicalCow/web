import FlowField from "@/components/FlowField";

const k = "text-[#ededed]";

export default function Home() {
  return (
    <main className="bg-[#0a0a0a] min-h-screen selection:bg-[#e8e8e8] selection:text-[#0a0a0a]">
      <FlowField />
      {/* Hero — full viewport, content anchored to bottom */}
      <section className="min-h-screen flex flex-col justify-center px-8 md:px-16 py-32">
        <div className="max-w-2xl">

          <h1 className="animate-fadeUp text-[2.75rem] md:text-[4rem] font-medium tracking-tight text-[#e8e8e8] mb-10 lowercase leading-[1.1]">
            raghav tirumale
          </h1>

          <div className="animate-fadeUp-delay text-[#787878] text-base md:text-[1.05rem] leading-[1.75] space-y-5">
            <p>
              i went to <span className={k}>tjhsst</span> for high school, where i built things alongside really strong peers. a 6 ft tall <span className={k}>humanoid</span> we got far enough to move a leg and balance in sim, and a <span className={k}>real time voice ai</span>, an early agentic harness built on top of existing models.
            </p>
            <p>
              i studied <span className={k}>computer engineering</span> at <span className={k}>uiuc</span> and finished in three years, most of it spent inside startups. an open source ai model i trained at <span className={k}>khoj</span> <span className={k}>(yc s23)</span>, rf and drone tracking at <span className={k}>guardian rf</span> <span className={k}>(yc s24)</span>, low bit inference at <span className={k}>deepgrove</span> <span className={k}>(yc s25)</span>, with grad classes on manycore parallel algorithms and machine learning systems in between. i also got to be in rooms with partners from places like <span className={k}>sequoia</span> and <span className={k}>y combinator</span>.
            </p>
            <p>
              i&apos;m most interested in <span className={k}>space</span>, <span className={k}>defense</span>, <span className={k}>robotics</span>, <span className={k}>manufacturing</span>, and <span className={k}>longevity tech</span>, the places where software meets atoms under real stakes, and companies like <span className={k}>anduril</span>, <span className={k}>saronic</span>, <span className={k}>epirus</span>, and <span className={k}>cx2</span>. being an <span className={k}>8vc fellow</span> let me get closer to the companies i care about.
            </p>
            <p>
              i&apos;ll be joining <span className={k}>anduril</span> shortly to work on the hardest problems along that thesis.
            </p>
            <p>
              outside that i meditate, train, cook, drink tea, and have long conversations with friends.
            </p>
            <p className="text-[#484848] pt-1">
              tirumale [dot] raghav [at] gmail [dot] com
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}
