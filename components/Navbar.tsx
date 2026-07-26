"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { navLinks, joinLabel, loginLabel } from "@/lib/site-content";
import { strings } from "@/lib/strings";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-ink/90 backdrop-blur-md border-b border-ink-line py-2"
          : "bg-transparent py-4"
      }`}
    >
      <nav className="mx-auto max-w-6xl px-5">
        <div className="flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-3">
            <Image
              src="/assets/logo-mark.svg"
              alt={strings.logoAlt}
              width={27}
              height={32}
              className="h-8 w-auto"
              preload
              unoptimized
            />
            <span className="gold-text font-logo text-xl leading-[1.8] hidden sm:block">
              {strings.navBrand}
            </span>
          </a>

          {/* روابط سطح المكتب */}
          <ul className="hidden md:flex items-center gap-7 text-sm text-parchment/80">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="hover:text-gold transition-colors duration-300"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="hidden md:inline-block text-sm text-parchment/80 hover:text-gold transition-colors duration-300"
            >
              {strings.app.navLink}
            </Link>
            <Link
              href="/login"
              className="hidden md:inline-block text-sm text-parchment/80 hover:text-gold transition-colors duration-300"
            >
              {loginLabel}
            </Link>
            <Link
              href="/register"
              className="hidden md:inline-block rounded-sm border border-gold px-5 py-2 text-sm text-gold hover:bg-gold hover:text-ink transition-colors duration-300"
            >
              {joinLabel}
            </Link>

            {/* زر القائمة للجوال */}
            <button
              type="button"
              aria-label={open ? strings.menuClose : strings.menuOpen}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(!open)}
              className="md:hidden flex flex-col gap-1.5 p-2"
            >
              <span
                className={`block h-0.5 w-6 bg-gold transition-transform duration-300 ${open ? "translate-y-2 rotate-45" : ""}`}
              />
              <span
                className={`block h-0.5 w-6 bg-gold transition-opacity duration-300 ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-6 bg-gold transition-transform duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* قائمة الجوال — داخل معلم التنقل نفسه */}
        {open && (
          <ul
            id="mobile-menu"
            className="md:hidden mt-3 border-t border-ink-line bg-ink/95 px-1 py-4 space-y-3 backdrop-blur-md"
          >
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-1 text-parchment/85 hover:text-gold transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/app"
                onClick={() => setOpen(false)}
                className="block py-1 text-parchment/85 hover:text-gold transition-colors"
              >
                {strings.app.navLink}
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block py-1 text-parchment/85 hover:text-gold transition-colors"
              >
                {loginLabel}
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="mt-2 inline-block rounded-sm border border-gold px-5 py-2 text-gold"
              >
                {joinLabel}
              </Link>
            </li>
          </ul>
        )}
      </nav>
    </header>
  );
}
