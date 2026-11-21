import { Newsreader } from "next/font/google";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import InkFilters from "@/components/InkFilters";

/* Shared look for the site: a plain solid page, crisp serif text, small mono
   labels, and green as the one accent. The ink drawing is the only texture.
   Type scale: display 2.5rem · body 1.25rem · mono 0.9375rem. */

const serif = Newsreader({ style: ["normal", "italic"], subsets: ["latin"], axes: ["opsz"] });

export const PAPER = "#fbfbf9";
export const INK = "#111111";
export const BODY = "#1f1f1f";
export const MUTED = "#6b6b6b";
export const GREEN = "#3f6a45";
const LINE = "#e3e3df";

const linkStyle: CSSProperties = {
  textDecoration: "underline",
  textDecorationThickness: "1px",
  textUnderlineOffset: "0.2em",
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

export function Rule() {
  return <hr className="border-0 border-t" style={{ borderColor: LINE }} />;
}

/* Small monospace text: section labels, dates, email. */
export function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[0.9375rem] tracking-[0.01em] ${className}`} style={{ color: MUTED }}>
      {children}
    </p>
  );
}

/* Solid page plus the ink filters the drawing uses. Also maps the older CSS
   variables (used by the markdown renderer) onto this palette so posts match. */
export function InkShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`min-h-screen antialiased ${serif.className} ${className}`}
      style={
        {
          background: PAPER,
          color: BODY,
          "--paper": PAPER,
          "--bg": PAPER,
          "--surface": "#f2f2ef",
          "--ink": INK,
          "--ink-soft": INK,
          "--body": BODY,
          "--body-prose": BODY,
          "--dim": MUTED,
          "--line": LINE,
          "--copper": GREEN,
          "--copper-dim": GREEN,
          "--copper-light": GREEN,
        } as CSSProperties
      }
    >
      <style>{`html,body{background:${PAPER}}`}</style>
      <InkFilters />
      {children}
    </div>
  );
}
