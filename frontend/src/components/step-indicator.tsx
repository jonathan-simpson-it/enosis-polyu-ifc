"use client";

import { motion } from "motion/react";

const STEPS = [
  "Select Source",
  "Analyze Input",
  "AI Translation",
  "Standardized Output",
  "Upload & Certify",
];

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((label, i) => {
        const state = i + 1 < current ? "done" : i + 1 === current ? "active" : "pending";
        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-3">
              <motion.div
                layout
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  state === "done"
                    ? "bg-emerald-500 text-white"
                    : state === "active"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {state === "done" ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </motion.div>
              <span
                className={`hidden sm:block text-sm font-medium ${
                  state === "done"
                    ? "text-emerald-600"
                    : state === "active"
                    ? "text-blue-600"
                    : "text-zinc-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-4 h-px w-8 sm:w-12 ${
                  state === "done" ? "bg-emerald-300" : "bg-zinc-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
