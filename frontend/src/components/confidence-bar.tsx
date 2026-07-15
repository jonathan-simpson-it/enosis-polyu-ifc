"use client";

import { motion } from "motion/react";

export function ConfidenceBar({
  label,
  original,
  translated,
  confidence,
}: {
  label: string;
  original: string;
  translated: string;
  confidence: number;
}) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 90 ? "bg-emerald-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-3 border-b border-zinc-100 last:border-0"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-sm text-zinc-700 truncate">{original}</p>
          <p className="text-sm font-medium text-zinc-900 mt-0.5">{translated}</p>
        </div>
        <div className="w-32 shrink-0 pt-5">
          <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className={`h-full rounded-full ${color}`}
            />
          </div>
          <p className="mt-1 text-xs text-right font-medium tabular-nums text-zinc-400">
            {pct}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}
