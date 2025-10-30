import React, { useMemo } from "react";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

// Minimal, theme-aligned footer: subtle glass panel, single row on desktop, stacked on mobile
const Footer = () => {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="w-full mt-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="relative rounded-2xl px-5 md:px-8 py-8 md:py-10 glass-elevated overflow-hidden">
          {/* Ambient gradient tint */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.35] bg-gradient-to-br from-primary/25 via-accent/10 to-transparent" />
          <div className="relative flex flex-col gap-6 md:gap-4 md:flex-row md:items-center md:justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3 max-w-sm">
              <div>
                <span className="text-lg font-semibold tracking-tight bg-gradient-to-r from-text to-text/70 dark:from-white dark:to-white/70 bg-clip-text text-transparent">VitalLink</span>
                <p className="text-xs md:text-sm text-secondary leading-relaxed">
                  Unified, secure & shareable health records.
                </p>
              </div>
            </div>
            {/* Social Icons */}
            <nav aria-label="Social" className="flex gap-6 md:gap-7 items-center">
              <a
                href="https://github.com/raghavvvgaba/HackX"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-secondary hover:text-accent transition-colors text-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-full"
              >
                <FaGithub />
              </a>
              <a
                href="https://linkedin.com/in/raghavvvgaba"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-secondary hover:text-accent transition-colors text-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-full"
              >
                <FaLinkedin />
              </a>
              <a
                href="mailto:raghavvvgaba@gmail.com"
                aria-label="Email"
                className="text-secondary hover:text-accent transition-colors text-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-full"
              >
                <FaEnvelope />
              </a>
            </nav>
          </div>
          {/* Divider */}
          <div className="mt-6 mb-5 h-px bg-gradient-to-r from-transparent via-text/10 dark:via-white/10 to-transparent" />
          {/* Bottom Row */}
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[11px] md:text-xs text-secondary">
            <p>© {year} VitalLink. All rights reserved.</p>
            <p className="flex items-center gap-1 text-secondary/70">Built by Raghav Gaba</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
