/**
 * Content + design-system verification for the DATUM redesign.
 * Drives real shipped source + live HTTP responses (no mocked content).
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/verify-redesign.mjs
 *   (defaults to http://localhost:3000)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = process.env.BASE_URL || "http://localhost:3000";
const scratch =
  process.env.SCRATCH || "/tmp/grok-goal-7120eb245893/implementer";

const failures = [];
const logs = [];

function ok(msg) {
  logs.push(`PASS  ${msg}`);
}
function fail(msg) {
  failures.push(msg);
  logs.push(`FAIL  ${msg}`);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

// ─── 1. Content preserved in source ─────────────────────────────────

const home = read("src/app/page.tsx");
const requiredHome = [
  "raghav tirumale",
  "tjhsst",
  "uiuc",
  "khoj",
  "guardian rf",
  "deepgrove",
  "anduril",
  "saronic",
  "epirus",
  "cx2",
  "8vc fellow",
  "sequoia",
  "y combinator",
  "tirumale [dot] raghav [at] gmail [dot] com",
  "i'll be joining",
  "meditate, train, cook, drink tea",
];

// Socials live in Navigation
const nav = read("src/components/Navigation.tsx");
const requiredNav = [
  "https://x.com/raghav_tiru",
  "https://www.linkedin.com/in/raghavtirumale/",
  "https://github.com/MythicalCow",
  'href: "/blog"',
  'href: "/"',
];

for (const s of requiredHome) {
  if (home.includes(s) || home.includes(s.replace("'", "&apos;")) || home.includes("i&apos;ll be joining")) {
    // handle escaped apostrophe for i'll
    if (s === "i'll be joining") {
      if (home.includes("i&apos;ll be joining") || home.includes("i'll be joining")) ok(`home content: ${s}`);
      else fail(`home missing: ${s}`);
    } else if (home.includes(s)) ok(`home content: ${s}`);
    else fail(`home missing: ${s}`);
  } else {
    fail(`home missing: ${s}`);
  }
}

for (const s of requiredNav) {
  if (nav.includes(s)) ok(`nav: ${s}`);
  else fail(`nav missing: ${s}`);
}

// Blog posts frontmatter / titles
const postsDir = path.join(root, "src/posts");
const posts = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
const expectedTitles = [
  "Making Reactive-Diffusion Systems Faster, A Deep Dive into Kernel Optimization with Triton",
  "Inferencing Transformers in Real-Time",
];
const allPostText = posts
  .map((f) => fs.readFileSync(path.join(postsDir, f), "utf8"))
  .join("\n");
for (const t of expectedTitles) {
  if (allPostText.includes(t)) ok(`post title present: ${t.slice(0, 40)}…`);
  else fail(`post title missing: ${t}`);
}

// External substack link preserved
if (
  allPostText.includes(
    "https://open.substack.com/pub/tianhaochen/p/inferencing-transformers-in-real"
  )
) {
  ok("external Substack URL preserved");
} else {
  fail("external Substack URL missing");
}

// ─── 2. Design system structural checks ─────────────────────────────

const css = read("src/app/globals.css");
const designTokens = [
  "--bg:",
  "--ink:",
  "--body:",
  "--signal:",
  "--measure-prose",
  "--motion-enter",
  "--ease-out",
  "prefers-reduced-motion",
  "fade-rise",
  ".datum-rule",
  ".nav-link",
  ".keyword-link",
  ".prose-link",
];
for (const t of designTokens) {
  if (css.includes(t)) ok(`token/system: ${t}`);
  else fail(`missing design token: ${t}`);
}

// Brass discipline: signal accent defined
if (css.includes("#c4b08a") || css.includes("--signal: #c4b08a")) {
  ok("brass signal accent present");
} else {
  fail("brass signal accent missing");
}

const lattice = read("src/components/ComputeLattice.tsx");
if (lattice.includes("isOrigin") && lattice.includes("prefers-reduced-motion")) {
  ok("lattice has origin datum + reduced-motion");
} else {
  fail("lattice missing origin or reduced-motion");
}

const md = read("src/components/MarkdownRenderer.tsx");
// Must be a Server Component so essay body is in initial HTML (SEO).
// Only the file-level directive counts (comments may mention the string).
const firstNonComment = md
  .split("\n")
  .map((l) => l.trim())
  .find((l) => l && !l.startsWith("//") && !l.startsWith("/*") && !l.startsWith("*"));
if (firstNonComment === '"use client";' || firstNonComment === "'use client';") {
  fail("MarkdownRenderer is client-only — essay body will not SSR");
} else {
  ok("MarkdownRenderer is a Server Component (no use client directive)");
}
// Prose tokens live in globals.css .essay-prose (static HTML pipeline)
if (css.includes(".essay-prose") && (css.includes("--body-prose") || css.includes("var(--body-prose)"))) {
  ok("essay prose styled via design tokens in CSS");
} else {
  fail("essay prose missing tokenized CSS");
}
if (md.includes("dangerouslySetInnerHTML") || md.includes("rehypeStringify")) {
  ok("markdown renders static HTML for SEO (no empty client shell)");
} else {
  fail("markdown may not ship static HTML body");
}
if (md.includes("#787878")) {
  fail("markdown still hard-codes legacy greys");
} else {
  ok("markdown free of legacy #787878 palette");
}

// Mobile nav must not jam writing+twitter: short labels or overflow treatment
if (nav.includes("short:") || nav.includes("sm:hidden") || nav.includes("isMobileMenuOpen")) {
  ok("nav has compact mobile social treatment");
} else {
  fail("nav missing compact mobile social treatment");
}

// Routes exist as app pages
const routes = [
  "src/app/page.tsx",
  "src/app/blog/page.tsx",
  "src/app/blog/[slug]/page.tsx",
  "src/app/experiment/page.tsx",
];
for (const r of routes) {
  if (fs.existsSync(path.join(root, r))) ok(`route file: ${r}`);
  else fail(`missing route file: ${r}`);
}

// ─── 3. Live HTTP (when server available) ───────────────────────────

async function fetchRoute(p) {
  const url = `${base}${p}`;
  const res = await fetch(url);
  const text = await res.text();
  return { status: res.status, text, url };
}

const liveRoutes = [
  {
    path: "/",
    must: ["raghav tirumale", "tjhsst", "anduril", "tirumale [dot]"],
  },
  {
    path: "/blog",
    must: ["writing", "Running a 20B Language Model", "Making Reactive-Diffusion", "Inferencing Transformers"],
  },
  {
    path: "/blog/making-reactive-diffusion-systems-faster",
    must: [
      "Making Reactive-Diffusion",
      "Gray-Scott",
      "Triton",
    ],
  },
  {
    path: "/experiment",
    must: ["home"],
  },
];

/** Strip scripts/styles/meta so body-fragment checks are not fooled by description tags. */
function bodyOnly(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<meta[^>]*>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ");
}

let liveOk = false;
try {
  // Home twice for consistency
  const h1 = await fetchRoute("/");
  const h2 = await fetchRoute("/");
  if (h1.status === 200 && h2.status === 200 && h1.text.includes("raghav tirumale") && h2.text.includes("raghav tirumale")) {
    ok("home fetch consistent (2×) with content");
    liveOk = true;
  } else {
    fail(`home fetch inconsistent or empty: ${h1.status}/${h2.status}`);
  }

  fs.mkdirSync(path.join(scratch, "routes"), { recursive: true });

  for (const route of liveRoutes) {
    const { status, text } = await fetchRoute(route.path);
    const safe = route.path.replace(/\//g, "_") || "home";
    fs.writeFileSync(path.join(scratch, "routes", `${safe}.html`), text);
    if (status !== 200) {
      fail(`${route.path} HTTP ${status}`);
      continue;
    }
    ok(`${route.path} HTTP 200`);
    for (const m of route.must) {
      if (text.includes(m)) ok(`${route.path} contains: ${m}`);
      else fail(`${route.path} missing: ${m}`);
    }
  }

  // Essay SEO: body must include substantial post prose outside meta/scripts
  const essay = await fetchRoute("/blog/making-reactive-diffusion-systems-faster");
  const essayBody = bodyOnly(essay.text);
  const bodyFragments = [
    "Introduction",
    "partial differential",
    "reaction-diffusion",
    "Efficient simulation",
    "kernel fusion",
  ];
  for (const frag of bodyFragments) {
    if (essayBody.includes(frag)) ok(`essay body HTML contains: ${frag}`);
    else fail(`essay body HTML missing (SEO): ${frag}`);
  }
  // Empty client shell was ~156 chars of article text; real body is tens of KB
  if (essayBody.length > 5000) {
    ok(`essay body HTML substantial (${essayBody.length} chars stripped)`);
  } else {
    fail(`essay body HTML too small (${essayBody.length} chars) — likely empty shell`);
  }
  if (essayBody.includes('aria-busy="true"') || essayBody.includes("Loading essay")) {
    fail("essay still ships loading shell instead of body");
  } else {
    ok("essay does not ship empty loading shell");
  }
} catch (e) {
  fail(`live HTTP unavailable at ${base}: ${e.message}`);
  logs.push("NOTE  Start the app (npm run start or npm run dev) and re-run with BASE_URL.");
}

// ─── Write report ───────────────────────────────────────────────────

const report = [
  `# Redesign verification`,
  `base: ${base}`,
  `time: ${new Date().toISOString()}`,
  `live: ${liveOk}`,
  ``,
  ...logs,
  ``,
  failures.length
    ? `RESULT: FAIL (${failures.length} failures)`
    : `RESULT: PASS`,
  ...failures.map((f) => `  - ${f}`),
].join("\n");

fs.mkdirSync(scratch, { recursive: true });
fs.writeFileSync(path.join(scratch, "content-routes.log"), report);
console.log(report);

process.exit(failures.length ? 1 : 0);
