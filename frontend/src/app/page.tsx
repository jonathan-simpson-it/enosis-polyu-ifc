"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ArrowRight, FileText, MagnifyingGlass, CloudArrowUp, SealCheck, ShieldCheck } from "@phosphor-icons/react";

const steps = [
  {
    icon: FileText,
    title: "Ingest",
    desc: "Drop any trade document — PDF invoice, Excel packing list, or WeChat screenshot. No integration needed.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: MagnifyingGlass,
    title: "Extract",
    desc: "AI identifies HS codes, weights, quantities, container numbers, and parties with per-field confidence scores.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: CloudArrowUp,
    title: "Export",
    desc: "Generate TSW Phase 3 or WCO Data Model v3.11 schemas. Submit directly to Hong Kong Trade Single Window.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

export default function Home() {
  const reduce = useReducedMotion();

  const fadeUp = (delay = 0) => ({
          initial: reduce ? false : { opacity: 0, y: 24 } as const,
          whileInView: { opacity: 1, y: 0 } as const,
          viewport: { once: true, amount: 0.3 } as const,
          transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const } as const,});

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-32">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
            className="max-w-3xl"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-zinc-900 leading-[1.05]">
              The clean, compliant gateway between{" "}
              <span className="text-blue-600">messy documents and AI</span>
            </h1>
            <p className="mt-6 text-lg text-zinc-500 leading-relaxed max-w-[65ch]">
              Translate any trade document into TSW-compliant schemas. No software installation. No cross-border data leakage.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/demo"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
              >
                Try the Demo
                <ArrowRight weight="bold" className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-[0.98]"
              >
                Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust bar */}
      <motion.div {...fadeUp(0.1)} className="border-b border-zinc-100 bg-zinc-50/50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-mono uppercase tracking-wider text-zinc-400">
            <span>TSW Phase 3 Compliant</span>
            <span className="h-4 w-px bg-zinc-200" />
            <span>WCO Data Model v3.11</span>
            <span className="h-4 w-px bg-zinc-200" />
            <span>Zero-Copy Data Privacy</span>
          </div>
        </div>
      </motion.div>

      {/* How it works */}
      <section className="border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-600 mb-4">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
              From messy document to compliant schema
            </h2>
            <p className="mt-4 text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              Three steps. No training. No IT setup.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                {...fadeUp(i * 0.1)}
                className="group relative rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-zinc-300 hover:shadow-sm"
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${step.bg}`}>
                  <step.icon weight="bold" className={`h-6 w-6 ${step.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TSW Compliance */}
      <section className="border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp()}>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-600 mb-4">
                TSW Phase 3
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 leading-[1.15]">
                Ready for Hong Kong's new trade mandate
              </h2>
              <p className="mt-4 text-zinc-500 leading-relaxed">
                Since May 1 2026, all road cargo advance information must be submitted through the
                Trade Single Window. Enosis translates your existing invoices and packing lists
                into TSW-compliant WCO XML schemas — no software installation, no API rewrites.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "40+ trade document types supported",
                  "System-to-system (S2S) submission ready",
                  "VASP partnership model — we translate, they submit",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-600">
                    <SealCheck weight="bold" className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              {...fadeUp(0.1)}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8"
            >
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck weight="bold" className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold text-zinc-900">Why SMEs choose Enosis</span>
              </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
                    <span className="text-zinc-500">Manual data entry time</span>
                    <span className="font-semibold text-zinc-900">45 min → 30 sec</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
                    <span className="text-zinc-500">Error rate</span>
                    <span className="font-semibold text-zinc-900">5% → less than 1%</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
                    <span className="text-zinc-500">Integration cost</span>
                    <span className="font-semibold text-zinc-900">HK$200K → HK$0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">HS code matching (target)</span>
                    <span className="font-semibold text-zinc-900">96.2% top-3</span>
                  </div>
                </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Research */}
      <section className="border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <motion.div {...fadeUp()} className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
              Research-backed accuracy
            </h2>
            <p className="mt-4 text-zinc-500 leading-relaxed">
              5 novel contributions targeting ACL, NeurIPS, and ICML
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "DocFormer-Trade", desc: "Multi-modal transformer for regulatory documents", metric: "+3.2% F1" },
              { title: "HierarchicalHS", desc: "Contrastive learning for HS code classification", metric: "10× less data" },
              { title: "UncertaintyGuard", desc: "Conformal prediction with provable error bounds", metric: "p<0.05" },
              { title: "MetaSchema", desc: "Zero-shot cross-vertical schema transfer", metric: "95% less labeling" },
              { title: "TradeBench", desc: "Open-source benchmark for regulatory documents", metric: "100K+ docs" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp(i * 0.06)}
                className="rounded-xl border border-zinc-200 bg-white p-5"
              >
                <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                <p className="text-xs text-zinc-500 mt-1">{item.desc}</p>
                <p className="text-xs font-mono text-blue-600 mt-2">{item.metric}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <motion.div {...fadeUp()}>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
              Ready to automate your trade declarations?
            </h2>
            <Link
              href="/demo"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              Try the Interactive Demo
              <ArrowRight weight="bold" className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
