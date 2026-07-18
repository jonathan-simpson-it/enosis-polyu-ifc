"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import { ClipboardText, UploadSimple, FileText, DownloadSimple, Gear } from "@phosphor-icons/react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: ClipboardText },
  { label: "Upload Document", href: "/upload", icon: UploadSimple },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Exports", href: "/exports", icon: DownloadSimple },
  { label: "Settings", href: "/settings", icon: Gear },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <aside className="w-64 bg-surface border-r border-line min-h-dvh flex flex-col">
      <div className="p-6 border-b border-line">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <img src="/enosis-logo-icon.png" alt="Enosis" className="h-8 w-8" />
          <div>
            <p className="text-base font-semibold tracking-tight text-ink">Enosis</p>
            <p className="text-[11px] text-muted">Data Ingestion Engine</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                active
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-accent-soft"
              }`}
            >
              <item.icon weight="bold" className={`h-5 w-5 ${active ? "text-accent" : "text-muted"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-line">
        <button
          onClick={handleLogout}
          className="w-full rounded-full px-4 py-2.5 text-sm text-muted hover:text-red-600 transition text-left"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
