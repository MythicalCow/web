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
    <div className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-sm">
      <nav className="mx-auto max-w-none px-8 md:px-16 py-5">
        <div className="flex items-center justify-between">
          {/* Nav links */}
          <div className="flex items-center gap-7">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-sm transition-colors duration-150 ${
                  isActive(item.href)
                    ? "text-[#c8c8c8]"
                    : "text-[#484848] hover:text-[#888]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Social links — desktop */}
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
                className="text-sm text-[#484848] hover:text-[#888] transition-colors"
              >
                {label} ↗
              </a>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-[#888]"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#0a0a0a] border-t border-[#161616] py-5 lg:hidden">
            <div className="px-8 flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm ${isActive(item.href) ? "text-[#c8c8c8]" : "text-[#484848]"}`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-[#161616] pt-4 flex flex-col gap-3">
                {[
                  { label: "twitter", href: "https://x.com/raghav_tiru" },
                  { label: "linkedin", href: "https://www.linkedin.com/in/raghavtirumale/" },
                  { label: "github", href: "https://github.com/MythicalCow" },
                ].map(({ label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-[#484848]">
                    {label} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
