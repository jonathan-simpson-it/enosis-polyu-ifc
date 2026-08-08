"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { User, Gear, Eye, EyeSlash, CopySimple } from "@phosphor-icons/react";
import { api, type UserProfile, type Organization } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  useEffect(() => {
    async function load() {
      try {
        const me = await api.getMe();
        setUser(me);
        if (me.org_id) {
          const orgData = await api.getOrg(me.org_id);
          setOrg(orgData);
        }
      } catch (err) {
        console.error("Settings load error:", err);
      }
    }
    load();
  }, []);

  async function handleRegenerateKey() {
    try {
      const res = await api.regenerateApiKey();
      setUser((prev) => (prev ? { ...prev, api_key: res.api_key } : prev));
      setShowKey(true);
    } catch (err) {
      console.error("Key regeneration failed:", err);
    }
  }

  function handleCopyKey() {
    if (user?.api_key) {
      navigator.clipboard.writeText(user.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const fadeUp = (delay = 0) => ({
          initial: reduce ? false : { opacity: 0, y: 12 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const } as const,});

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div {...fadeUp()} className="mb-8">
        <p className="text-xs font-mono uppercase tracking-[0.1em] text-accent mb-2">
          Settings
        </p>
        <h1 className="text-2xl font-display font-semibold tracking-tight text-ink">
          Account & Organization
        </h1>
      </motion.div>

      {user && (
        <motion.div {...fadeUp(0.05)} className="rounded-xl border border-line bg-surface p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <User weight="bold" className="h-5 w-5 text-muted" />
            <h2 className="text-sm font-semibold text-ink">Account</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="text-muted w-20 shrink-0">Email:</dt>
              <dd className="text-ink">{user.email}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-muted w-20 shrink-0">Name:</dt>
              <dd className="text-ink">{user.full_name || "Not provided"}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-muted w-20 shrink-0">Role:</dt>
              <dd className="capitalize text-ink">{user.role}</dd>
            </div>
            <div className="flex gap-3 items-start">
              <dt className="text-muted w-20 shrink-0 pt-0.5">API Key:</dt>
              <dd className="flex-1 min-w-0">
                {user.api_key ? (
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs text-muted bg-accent-soft rounded-lg px-2 py-1.5 border border-line truncate max-w-[280px] block">
                      {showKey ? user.api_key : `${user.api_key.slice(0, 12)}...${user.api_key.slice(-4)}`}
                    </code>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-accent-soft transition"
                      title={showKey ? "Hide" : "Show"}
                    >
                      {showKey ? <EyeSlash weight="bold" className="h-4 w-4" /> : <Eye weight="bold" className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={handleCopyKey}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-accent-soft transition"
                      title="Copy"
                    >
                      <CopySimple weight="bold" className="h-4 w-4" />
                    </button>
                    {copied && <span className="text-[11px] text-emerald-600">Copied!</span>}
                  </div>
                ) : (
                  <span className="text-muted">N/A</span>
                )}
              </dd>
            </div>
          </dl>
          <button
            onClick={handleRegenerateKey}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:bg-accent-soft active:scale-[0.98]"
          >
            Regenerate API Key
          </button>
        </motion.div>
      )}

      {org && (
        <motion.div {...fadeUp(0.1)} className="rounded-xl border border-line bg-surface p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gear weight="bold" className="h-5 w-5 text-muted" />
            <h2 className="text-sm font-semibold text-ink">Organization</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="text-muted w-24 shrink-0">Name:</dt>
              <dd className="text-ink">{org.name}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-muted w-24 shrink-0">BR Number:</dt>
              <dd className="text-ink">{org.br_number || "Not provided"}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-muted w-24 shrink-0">Plan:</dt>
              <dd className="capitalize text-ink">{org.subscription_tier}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-muted w-24 shrink-0">Usage:</dt>
              <dd className="text-ink">
                {org.usage_current} / {org.usage_limit}
              </dd>
            </div>
          </dl>
        </motion.div>
      )}
    </div>
  );
}
