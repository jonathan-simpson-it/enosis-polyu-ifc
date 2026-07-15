"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CaretRight, CaretDown } from "@phosphor-icons/react";

function ResourceBlock({ name, resource, depth = 0 }: { name: string; resource: Record<string, unknown>; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const entries = Object.entries(resource);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors py-1"
      >
        {open ? <CaretDown weight="bold" className="h-3 w-3" /> : <CaretRight weight="bold" className="h-3 w-3" />}
        <span>{name}</span>
        <span className="text-zinc-400 font-normal text-xs">({entries.length} keys)</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-4 pl-3 border-l border-zinc-200"
          >
            {entries.map(([key, val]) => (
              <div key={key} className="py-0.5">
                <span className="text-sm font-mono text-blue-600">{key}</span>
                <span className="text-zinc-300 mx-1.5">:</span>
                {renderValue(val, depth + 1)}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderValue(val: unknown, depth: number): React.ReactNode {
  if (val === null || val === undefined) {
    return <span className="text-sm text-zinc-400">null</span>;
  }
  if (typeof val === "string") {
    return <span className="text-sm text-emerald-700">&quot;{val}&quot;</span>;
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return <span className="text-sm text-amber-700">{String(val)}</span>;
  }
  if (Array.isArray(val)) {
    return (
      <div className="inline-flex flex-col gap-0.5">
        <span className="text-xs text-zinc-400">[{val.length} items]</span>
        {val.slice(0, 3).map((item, i) => (
          <div key={i} className="ml-2">
            {typeof item === "object" && item ? (
              <ResourceBlock
                name={`[${i}]`}
                resource={item as Record<string, unknown>}
                depth={depth + 1}
              />
            ) : (
              renderValue(item, depth + 1)
            )}
          </div>
        ))}
        {val.length > 3 && (
          <span className="text-xs text-zinc-400 ml-2">... and {val.length - 3} more</span>
        )}
      </div>
    );
  }
  if (typeof val === "object") {
    return (
      <ResourceBlock
        name="{...}"
        resource={val as Record<string, unknown>}
        depth={depth + 1}
      />
    );
  }
  return <span className="text-sm">{String(val)}</span>;
}

export function FhirViewer({ bundle }: { bundle: Record<string, unknown> | null }) {
  if (!bundle) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 font-mono text-sm leading-relaxed max-h-[400px] overflow-y-auto">
      {Object.entries(bundle).map(([key, val]) => (
        <div key={key} className="py-0.5">
          <span className="text-blue-600">{key}</span>
          <span className="text-zinc-300 mx-1.5">:</span>
          {renderValue(val, 0)}
        </div>
      ))}
    </div>
  );
}
