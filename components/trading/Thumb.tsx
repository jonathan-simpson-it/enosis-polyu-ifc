"use client";

import { useState } from "react";

export function Thumb({
  src,
  alt,
  size = 56,
  rounded = "rounded-md",
}: {
  src: string | null | undefined;
  alt: string;
  size?: number;
  rounded?: string;
}) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (!src || failed) {
    return (
      <div
        style={style}
        className={`flex shrink-0 items-center justify-center border border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-wide text-zinc-400 ${rounded}`}
        title={src ? "image failed to load" : "no image"}
      >
        {src ? "n/a" : "no img"}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setFailed(true)}
      className={`shrink-0 border border-zinc-200 object-cover ${rounded}`}
    />
  );
}