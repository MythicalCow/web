import { EB_Garamond } from "next/font/google";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import InkFilters from "@/components/InkFilters";
import { brush } from "@/components/MeditationDrawing";

/* Shared look for the site: newsprint paper, one ink tone, green second colour.
   Type scale: display 2.25rem · body 1.125rem · small 1rem. */

const garamond = EB_Garamond({ weight: ["400", "500"], style: ["normal", "italic"], subsets: ["latin"] });

export const PAPER = "#ece6d6";
export const INK = "#1c1a17";
export const BODY = "#24211c";
export const GREEN = "#3f6a45";

const linkStyle: CSSProperties = {
  textDecoration: "underline",
  textDecorationThickness: "1px",
  textUnderlineOffset: "0.22em",
  textDecorationColor: GREEN,
};

export function A({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
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
export function InkRule({ seed }: { seed: number }) {
  return (
    <svg viewBox="0 0 1000 10" preserveAspectRatio="none" className="block h-[7px] w-full" aria-hidden>
      <path d={brush([[2, 5.5], [250, 4.6], [520, 5.6], [780, 4.8], [998, 5.2]], 2.4, { seed, start: 0.35, end: 0.05, wobble: 0.25 })} fill={INK} opacity={0.4} />
    </svg>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[1rem] italic tracking-[0.01em]" style={{ color: GREEN }}>
      {children}
    </p>
  );
}

/* Paper, grain and ink filters. Also maps the older CSS variables (used by the
   markdown renderer) onto the ink palette so long-form pages match. */
export function InkShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative min-h-screen ${garamond.className} ${className}`}
      style={
        {
          background: PAPER,
          color: BODY,
          "--paper": PAPER,
          "--bg": PAPER,
          "--surface": "#e4ddca",
          "--ink": INK,
          "--ink-soft": INK,
          "--body": BODY,
          "--body-prose": BODY,
          "--dim": BODY,
          "--line": "#cfc6b0",
          "--copper": GREEN,
          "--copper-dim": GREEN,
          "--copper-light": GREEN,
        } as CSSProperties
      }
    >
      <style>{`html,body{background:${PAPER}}`}</style>
      <InkFilters />
      {/* newsprint grain */}
      <svg className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden style={{ mixBlendMode: "multiply", opacity: 0.45 }}>
        <rect width="100%" height="100%" filter="url(#paper-grain)" />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}
