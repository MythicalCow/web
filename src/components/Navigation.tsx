"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = useCallback((href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname?.startsWith(href)) return true;
    return false;
  }, [pathname]);

  const navItems = [
    { label: "home", href: "/" },
    { label: "writing", href: "/blog" },
  ];

  return (
    <div className="fixed top-0 z-50 w-full bg-[var(--bg)]/80 backdrop-blur-sm">
      <nav className="mx-auto max-w-none px-8 md:px-16 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-7">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`utility text-link ${
                  isActive(item.href)
                    ? "text-[var(--body)]"
                    : "text-[var(--dim)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-5">
            {[
              { label: "twitter", href: "https://x.com/raghav_tiru" },
              { label: "linkedin", href: "https://www.linkedin.com/in/raghavtirumale/" },
              { label: "github", href: "https://github.com/MythicalCow" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="utility text-link text-[var(--dim)]"
              >
                {label} <span className="external-arrow" aria-hidden>↗</span>
              </a>
            ))}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-[var(--body)]"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[var(--bg)] py-5 lg:hidden">
            <div className="px-8 flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`utility text-link ${isActive(item.href) ? "text-[var(--body)]" : "text-[var(--dim)]"}`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                {[
                  { label: "twitter", href: "https://x.com/raghav_tiru" },
                  { label: "linkedin", href: "https://www.linkedin.com/in/raghavtirumale/" },
                  { label: "github", href: "https://github.com/MythicalCow" },
                ].map(({ label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="utility text-link text-[var(--dim)]">
                    {label} <span className="external-arrow" aria-hidden>↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
      <div className="absolute bottom-0 left-8 right-8 h-px bg-[var(--line)] md:left-16 md:right-16" aria-hidden="true" />
    </div>
  );
}
