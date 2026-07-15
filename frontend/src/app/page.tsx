"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Database, Translate, CloudArrowUp } from "@phosphor-icons/react";

const steps = [
  {
    icon: Database,
    title: "Ingest",
    desc: "Extract patient data from any clinic CMS — no integration needed.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Translate,
    title: "Translate",
    desc: "AI maps diagnoses, medications, and labs to ICD-10, SNOMED-CT & FHIR R5.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: CloudArrowUp,
    title: "Upload",
    desc: "Auto-submit standardized records to eHealth+. Zero clinic effort.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

const certifications = [
  { level: "Bronze", records: "50+", accuracy: "80%+" },
  { level: "Silver", records: "200+", accuracy: "85%+" },
  { level: "Gold", records: "500+", accuracy: "90%+" },
  { level: "Platinum", records: "1K+", accuracy: "95%+" },
  { level: "Diamond", records: "5K+", accuracy: "97%+" },
];

export default function Home() {
  const reduce = useReducedMotion();

  const fadeUp = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.3 },
          transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

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
            <p className="mb-6 text-xs font-mono uppercase tracking-[0.2em] text-blue-600">
              PolyU IFC 2026
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-zinc-900 leading-[1.05]">
              The Universal{" "}
              <span className="text-blue-600">Data Translation</span> Layer
            </h1>
            <p className="mt-6 text-lg text-zinc-500 leading-relaxed max-w-[65ch]">
              Unlock data so every AI application can work.{" "}
              Zero setup. Zero work. Zero friction.{" "}
              Just automatic translation from any clinic system to eHealth+.
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
      <motion.div
        {...fadeUp(0.2)}
        className="border-b border-zinc-100 bg-zinc-50/50"
      >
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-mono uppercase tracking-wider text-zinc-400">
            <span>Powered by DeepSeek v4-flash</span>
            <span className="h-4 w-px bg-zinc-200" />
            <span>FHIR R5 Compliant</span>
            <span className="h-4 w-px bg-zinc-200" />
            <span>Playwright Automation</span>
            <span className="h-4 w-px bg-zinc-200" />
            <span>Smart Clinic Certified</span>
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
              One pipeline. Zero work.
            </h2>
            <p className="mt-4 text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              Enosis silently extracts, translates, and uploads patient data.
              The clinic never knows it exists.
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

      {/* Certification Preview */}
      <section className="border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <motion.div {...fadeUp()} className="mb-16 max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-600 mb-4">
              Smart Clinic Certification
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
              The Gold Play Button for Healthcare
            </h2>
            <p className="mt-4 text-zinc-500 leading-relaxed">
              Clinics earn prestigious badges for data quality and volume.
              Patients recognize the badge. More patients choose the clinic.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {certifications.map((c, i) => (
              <motion.div
                key={c.level}
                {...fadeUp(i * 0.08)}
                className="rounded-xl border border-zinc-200 bg-white p-5 text-center"
              >
                <p className="text-sm font-semibold text-zinc-900">{c.level}</p>
                <p className="mt-1 text-xs text-zinc-400">{c.records} · {c.accuracy}</p>
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
              Ready to see it in action?
            </h2>
            <p className="mt-4 text-zinc-500 max-w-xl mx-auto leading-relaxed">
              Watch Enosis transform raw clinic data into standardized FHIR R5
              and upload it to eHealth+ — automatically.
            </p>
            <Link
              href="/demo"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              Launch Interactive Demo
              <ArrowRight weight="bold" className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
