"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Twitter,
  Linkedin,
  Github,
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

  const handleContactClick = useCallback((e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      handleNavClick("posts");
    }
  }, [pathname, handleNavClick]);

  const navItems = [
    { label: "Home", href: "/", onClick: handleHomeClick },
    { label: "Posts", href: "/blog" },
    { label: "Contact", href: "/#posts", onClick: handleContactClick },
  ];

  const socialLinks = [
    { href: "https://x.com/raghav_tiru", icon: Twitter, label: "Twitter" },
    { href: "https://www.linkedin.com/in/raghavtirumale/", icon: Linkedin, label: "LinkedIn" },
    { href: "https://github.com/MythicalCow", icon: Github, label: "GitHub" },
  ];

  const isActive = useCallback((href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname?.startsWith(href)) return true;
    return false;
  }, [pathname]);

  return (
    <div className="fixed top-0 w-full z-50">
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
                  className={`text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "text-[#282828]"
                      : "text-gray-500 hover:text-[#282828]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          
          {/* Social Links & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <div className="lg:flex hidden space-x-5">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-[#282828] transition-colors duration-150"
                    aria-label={social.label}
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
            
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden text-[#282828]"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 py-4 lg:hidden z-10">
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
                      className={`text-sm font-medium transition-colors duration-150 py-2 ${
                        active
                          ? "text-[#282828]"
                          : "text-gray-500 hover:text-[#282828]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                
                <div className="border-t border-gray-100 pt-4 mt-2">
                  <div className="flex space-x-6">
                    {socialLinks.map((social) => {
                      const Icon = social.icon;
                      return (
                        <a
                          key={social.label}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-[#282828] transition-colors duration-150"
                          aria-label={social.label}
                        >
                          <Icon size={18} />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

