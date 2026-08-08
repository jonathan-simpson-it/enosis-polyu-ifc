import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "./theme";

export interface VOCue {
  text: string;
  from: number;
  to: number;
}

export const VO: VOCue[] = [
  {
    text: "Around 80% of enterprise data is trapped in unstructured documents.",
    from: 135,
    to: 292,
  },
  {
    text: "Thirty years of paper. Thousands of documents.",
    from: 330,
    to: 425,
  },
  {
    text: "Introducing Enosis. Upload the documents you already have.",
    from: 565,
    to: 795,
  },
  {
    text: "Enosis extracts, validates, and structures. Automatically.",
    from: 865,
    to: 1005,
  },
  {
    text: "Only review the exceptions.",
    from: 1100,
    to: 1195,
  },
  {
    text: "Structured data. Ready for any enterprise system.",
    from: 1405,
    to: 1545,
  },
];

export const NetflixCaption: React.FC = () => {
  const frame = useCurrentFrame();
  const active = VO.find((c) => frame >= c.from && frame <= c.to);
  if (!active) return null;

  const inAt = active.from;
  const outAt = active.to;
  const opacity = interpolate(
    frame,
    [inAt, inAt + 7, outAt - 7, outAt],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) },
  );
  const translate = interpolate(frame, [inAt, inAt + 7], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        zIndex: 90,
        pointerEvents: "none",
        paddingBottom: 108,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.body,
          fontWeight: 600,
          fontSize: 42,
          lineHeight: 1.25,
          color: COLORS.white,
          textAlign: "center",
          maxWidth: 1500,
          opacity,
          translate: `0px ${translate}px`,
          textShadow: "0 2px 10px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.6)",
        }}
      >
        {active.text}
      </div>
    </AbsoluteFill>
  );
};
