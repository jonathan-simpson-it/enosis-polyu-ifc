"use client";

import { motion } from "motion/react";

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  bronze: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
    glow: "rgba(217,119,6,0.15)",
  },
  silver: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    glow: "rgba(100,116,139,0.15)",
  },
  gold: {
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-300",
    glow: "rgba(234,179,8,0.15)",
  },
  platinum: {
    bg: "bg-cyan-50",
    text: "text-cyan-800",
    border: "border-cyan-300",
    glow: "rgba(6,182,212,0.15)",
  },
  diamond: {
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-300",
    glow: "rgba(99,102,241,0.15)",
  },
};

export function Badge({
  level,
  records,
  accuracy,
}: {
  level: string;
  records?: number;
  accuracy?: number;
}) {
  const colors = BADGE_COLORS[level] ?? BADGE_COLORS.gold;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ boxShadow: `0 0 40px ${colors.glow}` }}
      className={`inline-flex flex-col items-center gap-2 rounded-2xl border-2 ${colors.border} ${colors.bg} px-8 py-6 text-center`}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${colors.bg} ${colors.text} ring-4 ring-white`}
      >
        {level === "diamond" ? "💎" : level.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className={`text-lg font-bold capitalize ${colors.text}`}>
          {level} Clinic
        </p>
        {records !== undefined && (
          <p className="text-sm text-zinc-500 mt-0.5">
            {records.toLocaleString()} records uploaded
          </p>
        )}
        {accuracy !== undefined && (
          <p className="text-sm text-zinc-500">
            {(accuracy * 100).toFixed(0)}% accuracy
          </p>
        )}
      </div>
    </motion.div>
  );
}
