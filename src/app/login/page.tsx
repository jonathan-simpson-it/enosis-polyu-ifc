"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { api } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = isRegister
        ? await api.register(email, password, orgName, fullName)
        : await api.login(email, password);
      setToken(res.access_token);
      setUser({ id: res.user_id, orgId: res.org_id });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || (isRegister ? "Registration failed" : "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  const fadeUp = (delay = 0) => ({
          initial: reduce ? false : { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const } as const,});

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
      <motion.div {...fadeUp()} className="w-full max-w-md">
        <div className="bg-surface rounded-xl border border-line p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <img src="/enosis-logo-icon.png" alt="Enosis" className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-display font-semibold tracking-tight text-ink">
              {isRegister ? "Create Account" : "Sign In"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {isRegister
                ? "Set up your organization"
                : "GBA Trade Document Engine"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent"
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent"
                placeholder="Enter your password"
                required
              />
            </div>
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent"
                    placeholder="Your Company Ltd."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent"
                    placeholder="Jane Lau"
                  />
                </div>
              </>
            )}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(""); }}
              className="text-sm text-accent hover:text-accent transition"
            >
              {isRegister ? "Already have an account? Sign in" : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
