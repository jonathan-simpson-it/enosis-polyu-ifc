"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const APP_ROUTES = ["/dashboard", "/upload", "/documents", "/exports", "/settings"];

const links = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
  { href: "/login", label: "Sign In" },
];

export function Nav() {
  const path = usePathname();

  if (APP_ROUTES.some((r) => path.startsWith(r))) return null;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/enosis-logo-icon.png"
            alt="Enosis"
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="text-lg font-semibold tracking-tight text-ink font-display">
            Enosis
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active = path === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-xs font-medium uppercase tracking-[0.08em] rounded-lg transition-colors ${
                  active
                    ? "text-ink"
                    : "text-muted hover:text-ink hover:bg-accent-soft"
                }`}
              >
                {link.label}
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-accent-soft -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.header>
  );
}
