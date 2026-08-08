"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  MagnifyingGlass,
  CloudArrowUp,
  SealCheck,
  Cube,
  Leaf,
  Building,
  Heartbeat,
  ArrowsIn,
} from "@phosphor-icons/react";
import ConvergenceAnimation from "@/components/convergence-animation";

const steps = [
  {
    icon: FileText,
    title: "Ingest",
    desc: "Drop any document: PDF invoice, Excel packing list, or WeChat screenshot. No integration needed.",
  },
  {
    icon: MagnifyingGlass,
    title: "Extract",
    desc: "AI identifies HS codes, weights, quantities, container numbers, and parties with per-field confidence scores.",
  },
  {
    icon: CloudArrowUp,
    title: "Export",
    desc: "Generate TSW Phase 3 or WCO Data Model v3.11 schemas. Submit directly to Hong Kong Trade Single Window.",
  },
];

const DOMAINS = [
  {
    icon: Cube,
    title: "Trade & TSW",
    desc: "Translate invoices and packing lists into compliant WCO XML. Submission-ready for Hong Kong's Trade Single Window.",
    tag: "Today",
    tagColor: "text-accent",
  },
  {
    icon: Leaf,
    title: "ESG Scope 3",
    desc: "Parse carbon invoices, supplier reports, and sustainability disclosures into structured GHG protocol data.",
    tag: "Coming",
    tagColor: "text-muted",
  },
  {
    icon: Building,
    title: "Construction 4S",
    desc: "Extract specifications, compliance docs, and CMP data from construction blueprints and material sheets.",
    tag: "Coming",
    tagColor: "text-muted",
  },
  {
    icon: Heartbeat,
    title: "Healthcare",
    desc: "Normalise medical claims, lab reports, and patient intake forms into insurance-ready structured data.",
    tag: "Coming",
    tagColor: "text-muted",
  },
];

const research = [
  { title: "DocFormer-Trade", desc: "Multi-modal transformer for regulatory documents", metric: "+3.2% F1" },
  { title: "HierarchicalHS", desc: "Contrastive learning for HS code classification", metric: "10× less data" },
  { title: "UncertaintyGuard", desc: "Conformal prediction with provable error bounds", metric: "p<0.05" },
  { title: "MetaSchema", desc: "Zero-shot cross-vertical schema transfer", metric: "95% less labeling" },
  { title: "TradeBench", desc: "Open-source benchmark for regulatory documents", metric: "100K+ docs" },
];

export default function Home() {
  const reduce = useReducedMotion();

  const fadeUp = (delay = 0) =>
    reduce
      ? {}
      : ({
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
        } as const);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-16 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-xs font-mono uppercase tracking-[0.1em] text-accent mb-4">
                Universal Document Intelligence Engine
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-ink leading-[1.08] font-display">
                The clean, compliant gateway between{" "}
                <span className="text-accent">messy documents and AI</span>
              </h1>
              <p className="mt-5 text-base text-muted leading-relaxed max-w-[60ch]">
                Translate any trade document into TSW-compliant schemas. No software installation.
                No cross-border data leakage.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/demo"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-xs font-semibold text-surface uppercase tracking-[0.06em] transition-all hover:bg-ink/80 active:scale-[0.98]"
                >
                  Try the Demo
                  <ArrowRight weight="bold" className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 text-xs font-semibold text-ink uppercase tracking-[0.06em] transition-all hover:bg-accent-soft active:scale-[0.98]"
                >
                  Dashboard
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block"
            >
              <ConvergenceAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <motion.div {...fadeUp(0.1)} className="border-b border-line bg-accent-soft/30">
        <div className="mx-auto max-w-7xl px-6 py-7">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-mono uppercase tracking-wider text-muted">
            <span>TSW Phase 3 Compliant</span>
            <span className="h-4 w-px bg-line" />
            <span>WCO Data Model v3.11</span>
            <span className="h-4 w-px bg-line" />
            <span>Zero-Copy Data Privacy</span>
          </div>
        </div>
      </motion.div>

      {/* Impact strip */}
      <motion.div {...fadeUp(0.15)} className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
            {[
              { value: "95%", label: "accuracy guarantee", note: "p<0.05, per field, per document" },
              { value: "<120s", label: "per document", note: "from paper in hand to verified JSON" },
              { value: "HK$349", label: "flat rate per month", note: "no per-document fees, no setup cost" },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface p-6">
                <p className="text-3xl font-semibold text-ink font-display tracking-tight">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-ink">{stat.label}</p>
                <p className="mt-0.5 text-xs text-muted">{stat.note}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* How it works */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <motion.div {...fadeUp()} className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-display">
              From messy document to compliant schema
            </h2>
            <p className="mt-3 text-muted max-w-2xl leading-relaxed text-sm">
              Three steps. No training. No IT setup. The middle step is the engine, the other two
              are yours.
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden md:block absolute top-12 left-[16.6%] right-[16.6%] h-px bg-line" aria-hidden />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  {...fadeUp(i * 0.1)}
                  className={`relative rounded-xl border p-8 ${
                    i === 1
                      ? "border-accent bg-accent-soft/40"
                      : "border-line bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-5xl font-display font-normal text-line select-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink">
                      <step.icon weight="bold" className="h-6 w-6 text-surface" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">{step.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div {...fadeUp(0.3)} className="mt-12 flex justify-center">
            <img
              src="https://images.pexels.com/photos/669610/pexels-photo-669610.jpeg"
              alt="Team processing documents"
              className="rounded-xl border border-line w-full max-w-3xl h-48 sm:h-64 object-cover opacity-80"
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      {/* TSW Compliance */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp()}>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink leading-[1.15] font-display">
                Ready for Hong Kong&apos;s new trade mandate
              </h2>
              <p className="mt-4 text-muted leading-relaxed text-sm">
                Since May 1 2026, all road cargo advance information must be submitted through the
                Trade Single Window. Enosis translates your existing invoices and packing lists into
                TSW-compliant WCO XML schemas. No software installation, no API rewrites.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "40+ trade document types supported",
                  "System-to-system (S2S) submission ready",
                  "VASP partnership model: we translate, they submit",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted">
                    <SealCheck weight="bold" className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div {...fadeUp(0.1)} className="rounded-xl border border-line bg-surface p-8">
              <img
                src="https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg"
                alt="Shipping containers at port"
                className="rounded-lg mb-6 w-full h-48 object-cover opacity-85"
                loading="lazy"
              />
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center pb-3 border-b border-line">
                  <span className="text-muted">Manual data entry time</span>
                  <span className="font-semibold text-ink">45 min → 30 sec</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-line">
                  <span className="text-muted">Error rate</span>
                  <span className="font-semibold text-ink">5% → less than 1%</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-line">
                  <span className="text-muted">Integration cost</span>
                  <span className="font-semibold text-ink">HK$200K → HK$0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">HS code matching (target)</span>
                  <span className="font-semibold text-ink">96.2% top-3</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Beyond trade: One engine, every domain */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <motion.div {...fadeUp()} className="max-w-2xl mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-display">
              One engine, every domain
            </h2>
            <p className="mt-3 text-muted text-sm leading-relaxed">
              The same infrastructure that parses shipping manifests today can parse carbon invoices
              tomorrow. Enosis is a horizontal schema-normalisation engine. Our
              <span className="text-accent font-medium"> MetaSchema </span>
              zero-shot transfer adapts to any vertical without retraining.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                <ArrowsIn weight="bold" className="h-3 w-3 mr-1" />
                Zero-shot cross-vertical transfer
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div
              {...fadeUp(0)}
              className="lg:col-span-2 rounded-xl border border-accent bg-surface p-8 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink">
                  <Cube weight="bold" className="h-6 w-6 text-surface" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-accent">
                  Today
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-ink mb-2">Trade &amp; TSW</h3>
                <p className="text-sm text-muted leading-relaxed max-w-xl">
                  Translate invoices and packing lists into compliant WCO XML. Submission-ready for
                  Hong Kong&apos;s Trade Single Window, Phase 3 mandate live since May 2026.
                </p>
              </div>
            </motion.div>

            {DOMAINS.slice(1).map((domain, i) => (
              <motion.div
                key={domain.title}
                {...fadeUp(0.08 * (i + 1))}
                className="rounded-xl border border-line bg-surface p-6 flex items-start gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
                  <domain.icon weight="bold" className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-ink">{domain.title}</h3>
                    <span className={`text-[11px] font-mono uppercase tracking-wider ${domain.tagColor}`}>
                      {domain.tag}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{domain.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp(0.3)} className="mt-8 p-6 rounded-xl border border-line bg-accent-soft/30">
            <p className="text-sm text-muted leading-relaxed italic">
              &ldquo;If the ESG market shifts, our engine doesn&apos;t care. The exact same
              infrastructure parsing carbon invoices today can parse shipping manifests tomorrow or
              medical claims the day after.&rdquo;
            </p>
          </motion.div>
        </div>
      </section>

      {/* Research */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <motion.div {...fadeUp()} className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-display">
              Research-backed accuracy
            </h2>
            <p className="mt-3 text-muted text-sm leading-relaxed">
              5 novel contributions targeting ACL, NeurIPS, and ICML
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="rounded-xl border border-line bg-surface overflow-hidden">
            {research.map((item, i) => (
              <motion.div
                key={item.title}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 px-6 py-4 ${
                  i > 0 ? "border-t border-line" : ""
                }`}
              >
                <div className="flex items-baseline gap-3 min-w-0 flex-1">
                  <span className="text-xs font-mono text-muted w-8 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-semibold text-ink shrink-0">{item.title}</span>
                  <span className="text-xs text-muted truncate">{item.desc}</span>
                </div>
                <span className="text-xs font-mono text-accent sm:pl-0 pl-11">{item.metric}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <motion.div {...fadeUp()}>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-display">
              Ready to automate your trade declarations?
            </h2>
            <Link
              href="/demo"
              className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-8 text-xs font-semibold text-surface uppercase tracking-[0.06em] transition-all hover:bg-ink/80 active:scale-[0.98]"
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
