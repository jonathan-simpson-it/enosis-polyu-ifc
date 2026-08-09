import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const Scene10EndCard: React.FC = () => {
  const frame = useCurrentFrame();

  const fade = (at: number) => ({
    opacity: interpolate(frame, [at, at + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  });

  const out = interpolate(frame, [80, 92], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        opacity: out,
      }}
    >
      <div
        style={{
          fontFamily: "Georgia, 'Times New Roman', Times, serif",
          fontSize: 120,
          color: COLORS.white,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          ...fade(4),
        }}
      >
        ENOSIS
      </div>

      <div
        style={{
          marginTop: 34,
          fontFamily: FONTS.body,
          fontWeight: 600,
          fontSize: 44,
          letterSpacing: "0.06em",
          color: COLORS.white,
          textTransform: "uppercase",
          textAlign: "center",
          ...fade(18),
        }}
      >
        Unlock the data. Power the AI.
      </div>

      <div
        style={{
          marginTop: 44,
          fontFamily: FONTS.mono,
          fontSize: 26,
          letterSpacing: "0.1em",
          color: COLORS.sageBright,
          ...fade(34),
        }}
      >
        enosis.jonathansimpson.co
      </div>

      <div
        style={{
          marginTop: 30,
          fontFamily: FONTS.body,
          fontSize: 24,
          letterSpacing: "0.22em",
          color: COLORS.muted,
          textTransform: "uppercase",
          ...fade(46),
        }}
      >
        Coming to Hong Kong · 2026
      </div>
    </AbsoluteFill>
  );
};
