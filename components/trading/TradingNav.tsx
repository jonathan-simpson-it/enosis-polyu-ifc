"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TRADING_BASE } from "@/lib/trading/base";

const LINKS = [
  { href: TRADING_BASE, label: "Dashboard" },
  { href: `${TRADING_BASE}/tour`, label: "Tour" },
  { href: `${TRADING_BASE}/buyers`, label: "Buyers" },
  { href: `${TRADING_BASE}/products`, label: "Products" },
  { href: `${TRADING_BASE}/matches`, label: "Match Explorer" },
  { href: `${TRADING_BASE}/model`, label: "Model" },
  { href: `${TRADING_BASE}/evaluation`, label: "Evaluation" },
  { href: `${TRADING_BASE}/settings`, label: "Settings" },
];

export function TradingNav() {
  const path = usePathname();
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4">
        <Link href={TRADING_BASE} className="flex items-center gap-2 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
            DB
          </span>
          <span className="text-sm font-semibold tracking-tight text-zinc-900">Deep Bridge</span>
          <span className="hidden text-[11px] text-zinc-400 md:inline">B2B recommendation engine</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => {
            const active = l.href === TRADING_BASE ? path === TRADING_BASE : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] ${
                  active ? "bg-zinc-100 font-medium text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/"
          className="ml-auto whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] text-zinc-400 hover:text-zinc-900"
        >
          Back to Enosis
        </Link>
      </div>
    </header>
  );
}