"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu,
  X
} from "lucide-react";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = useCallback((sectionId: string) => {
    if (typeof window !== "undefined") {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  const handleHomeClick = useCallback((e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      handleNavClick("home");
    }
  }, [pathname, handleNavClick]);


  const navItems = [
    { label: "home", href: "/", onClick: handleHomeClick },
    { label: "writing", href: "/blog" },
  ];

  const isActive = useCallback((href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname?.startsWith(href)) return true;
    return false;
  }, [pathname]);

  return (
    <div className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm transition-colors duration-300">
      <nav className="mx-auto max-w-4xl px-6 py-4">
        <div className="flex items-center justify-between h-12">
          {/* Desktop Navigation */}
          <div className="flex items-center space-x-8">
            {navItems.map((item) => {
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={item.onClick}
                  className={`text-base font-medium transition-colors duration-150 ${
                      active
                        ? "text-[#282828] dark:text-[#e5e5e5]"
                        : "text-gray-500 dark:text-gray-400 hover:text-[#282828] dark:hover:text-[#e5e5e5]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          
          {/* Social Links & Mobile Menu Button */}
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2">
              <a href="https://x.com/raghav_tiru" target="_blank" rel="noopener noreferrer" className="text-base font-medium text-gray-500 dark:text-gray-400 hover:text-[#282828] dark:hover:text-[#e5e5e5] transition-colors">
                <span>↗</span> <span className="underline decoration-gray-300 dark:decoration-gray-600 decoration-[0.5px] underline-offset-2">twitter</span>
              </a>
              <a href="https://www.linkedin.com/in/raghavtirumale/" target="_blank" rel="noopener noreferrer" className="text-base font-medium text-gray-500 dark:text-gray-400 hover:text-[#282828] dark:hover:text-[#e5e5e5] transition-colors">
                <span>↗</span> <span className="underline decoration-gray-300 dark:decoration-gray-600 decoration-[0.5px] underline-offset-2">linkedin</span>
              </a>
              <a href="https://github.com/MythicalCow" target="_blank" rel="noopener noreferrer" className="text-base font-medium text-gray-500 dark:text-gray-400 hover:text-[#282828] dark:hover:text-[#e5e5e5] transition-colors">
                <span>↗</span> <span className="underline decoration-gray-300 dark:decoration-gray-600 decoration-[0.5px] underline-offset-2">github</span>
              </a>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden text-[#282828] dark:text-[#e5e5e5] transition-colors duration-300"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-gray-800 py-4 lg:hidden z-10 transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-6">
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={(e) => {
                        item.onClick?.(e);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`text-base font-medium transition-colors duration-150 py-2 ${
                        active
                          ? "text-[#282828] dark:text-[#e5e5e5]"
                          : "text-gray-500 dark:text-gray-400 hover:text-[#282828] dark:hover:text-[#e5e5e5]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2 flex flex-col gap-2">
                  <a href="https://x.com/raghav_tiru" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-[#282828] dark:hover:text-[#e5e5e5] transition-colors py-2">
                    <span>↗</span> <span className="underline decoration-gray-300 dark:decoration-gray-600 decoration-[0.5px] underline-offset-2">twitter</span>
                  </a>
                  <a href="https://www.linkedin.com/in/raghavtirumale/" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-[#282828] dark:hover:text-[#e5e5e5] transition-colors py-2">
                    <span>↗</span> <span className="underline decoration-gray-300 dark:decoration-gray-600 decoration-[0.5px] underline-offset-2">linkedin</span>
                  </a>
                  <a href="https://github.com/MythicalCow" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-[#282828] dark:hover:text-[#e5e5e5] transition-colors py-2">
                    <span>↗</span> <span className="underline decoration-gray-300 dark:decoration-gray-600 decoration-[0.5px] underline-offset-2">github</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

