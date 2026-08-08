"use client";

import { motion, useReducedMotion } from "motion/react";
import { FileText, ArrowRight } from "@phosphor-icons/react";

const DOCS = [
  { label: "Invoice", delay: 0, color: "bg-accent text-white" },
  { label: "Packing List", delay: 0.5, color: "bg-accent text-white" },
  { label: "WeChat", delay: 1.0, color: "bg-accent text-white" },
  { label: "CSV", delay: 1.5, color: "bg-accent text-white" },
  { label: "PDF", delay: 2.0, color: "bg-accent text-white" },
];

const entryPositions = [
  { x: -140, y: -60 },
  { x: 140, y: -40 },
  { x: -160, y: 40 },
  { x: 120, y: 60 },
  { x: -80, y: 90 },
];

export default function ConvergenceAnimation() {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className="flex items-center justify-center h-full min-h-[320px]">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-ink/90">
            <img src="/enosis-logo-icon.png" alt="Enosis" className="h-10 w-10 rounded-lg object-cover" />
          </div>
          <ArrowRight weight="bold" className="h-6 w-6 text-accent" />
          <div className="flex h-10 items-center rounded-full bg-accent px-4 text-xs font-medium text-white uppercase tracking-wider">
            Schema Ready
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center h-full min-h-[320px] w-full">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300">
        <motion.path
          d="M60,100 Q150,60 200,150"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.0, delay: 2.0, ease: "easeInOut" }}
        />
        <motion.path
          d="M340,90 Q250,50 200,150"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.0, delay: 2.3, ease: "easeInOut" }}
        />
        <motion.path
          d="M50,180 Q150,220 200,150"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.0, delay: 2.6, ease: "easeInOut" }}
        />
        <motion.path
          d="M360,180 Q260,220 200,150"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.0, delay: 2.9, ease: "easeInOut" }}
        />
        <motion.path
          d="M200,30 Q200,80 200,150"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.0, delay: 3.2, ease: "easeInOut" }}
        />
      </svg>

      {DOCS.map((doc, i) => {
        const ep = entryPositions[i];
        return (
          <motion.div
            key={doc.label}
            className="absolute flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 shadow-sm"
            initial={{ opacity: 0, x: ep.x, y: ep.y, scale: 0.8 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [ep.x, 0, 0, 0],
              y: [ep.y, 0, 0, 0],
              scale: [0.8, 1, 1, 0.6],
            }}
            transition={{
              duration: 3.5,
              delay: doc.delay,
              times: [0, 0.15, 0.65, 0.85],
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <FileText weight="bold" className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium text-ink whitespace-nowrap">{doc.label}</span>
          </motion.div>
        );
      })}

      <motion.div
        className="flex h-20 w-20 items-center justify-center rounded-2xl bg-ink/90 shadow-lg z-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 1.2, 1], opacity: [0, 0, 1, 1] }}
        transition={{ duration: 2.0, delay: 4.0, times: [0, 0.3, 0.7, 1], ease: [0.16, 1, 0.3, 1] }}
      >
        <img src="/enosis-logo-icon.png" alt="Enosis" className="h-10 w-10 rounded-lg object-cover" />
      </motion.div>

      <motion.div
        className="absolute right-0 flex items-center gap-2 rounded-full bg-accent px-4 py-2 shadow-sm z-20"
        initial={{ opacity: 0, x: 40, scale: 0.8 }}
        animate={{ opacity: [0, 0, 1, 1], x: [40, 40, 0, 0], scale: [0.8, 0.8, 1, 1] }}
        transition={{ duration: 1.6, delay: 5.5, times: [0, 0.3, 0.7, 1], ease: [0.16, 1, 0.3, 1] }}
      >
        <ArrowRight weight="bold" className="h-4 w-4 text-white" />
        <span className="text-xs font-semibold text-white whitespace-nowrap uppercase tracking-wider">
          Structured Schema
        </span>
      </motion.div>
    </div>
  );
}
