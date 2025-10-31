import React, { useMemo } from "react";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="w-full mt-20 relative">
      {/* Full width background with subtle gradient */}
      <div className="absolute inset-0 h-full bg-gradient-to-r from-darkBlue/5 via-transparent to-darkBlue/5" />
      
      <div className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12 md:gap-20 mb-12">
            {/* Brand Section - Left */}
            <div className="flex flex-col gap-4 flex-shrink-0">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-brand mb-2">VitalLink</h3>
                <p className="text-sm md:text-base text-secondary leading-relaxed max-w-xs">
                  Unified, secure & shareable health records for everyone.
                </p>
              </div>
            </div>

            {/* Right Section - Product & Connect */}
            <div className="flex flex-col md:flex-row gap-12 md:gap-20">
              {/* Quick Links Section */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-white/80">Product</h4>
                <nav className="flex flex-col gap-2 text-sm text-secondary">
                  <a href="#features" className="hover:text-accent transition-colors">Features</a>
                  <a href="#faq" className="hover:text-accent transition-colors">FAQ</a>
                  <a href="#" className="hover:text-accent transition-colors">Pricing</a>
                </nav>
              </div>

              {/* Social Section */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-white/80">Connect</h4>
                <nav aria-label="Social" className="flex gap-4 items-center">
                  <a
                    href="https://github.com/raghavvvgaba/HackX"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="text-secondary hover:text-accent transition-colors duration-300 text-lg"
                  >
                    <FaGithub />
                  </a>
                  <a
                    href="https://linkedin.com/in/raghavvvgaba"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="text-secondary hover:text-accent transition-colors duration-300 text-lg"
                  >
                    <FaLinkedin />
                  </a>
                  <a
                    href="mailto:raghavvvgaba@gmail.com"
                    aria-label="Email"
                    className="text-secondary hover:text-accent transition-colors duration-300 text-lg"
                  >
                    <FaEnvelope />
                  </a>
                </nav>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0 mb-8" />

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-xs md:text-sm">
            <p className="text-secondary">© {year} VitalLink. All rights reserved.</p>
            <div className="flex flex-col gap-1">
              <p className="text-secondary">Built with <span className="text-accent">❤️</span></p>
              <p className="text-secondary/70">Team Code Vol 1</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
