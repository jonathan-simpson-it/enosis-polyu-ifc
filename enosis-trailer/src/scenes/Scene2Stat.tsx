import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const Scene2Stat: React.FC = () => {
  const frame = useCurrentFrame();

  const count = Math.round(
    interpolate(frame, [10, 55], [0, 80], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }),
  );

  const label = {
    opacity: interpolate(frame, [60, 76], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
    translate: interpolate(frame, [60, 80], ["0px 24px", "0px 0px"], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  };

  const sub = {
    opacity: interpolate(frame, [85, 100], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  };

  const stagger = (i: number) =>
    interpolate(frame, [85 + i * 4, 100 + i * 4], [0, 1], {
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
      }}
    >
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: 420,
          lineHeight: 1,
          color: COLORS.white,
          letterSpacing: "-0.02em",
          display: "flex",
          alignItems: "baseline",
        }}
      >
        {count}
        <span style={{ color: COLORS.sageBright, fontSize: 260, marginLeft: 12 }}>%</span>
      </div>
      <div
        style={{
          fontFamily: FONTS.body,
          fontWeight: 600,
          fontSize: 46,
          letterSpacing: "0.08em",
          color: COLORS.white,
          textTransform: "uppercase",
          marginTop: 28,
          ...label,
        }}
      >
        of enterprise data is unstructured
      </div>
      <div
        style={{
          display: "flex",
          gap: 18,
          marginTop: 42,
          ...sub,
        }}
      >
        {["PDFs", "Invoices", "Receipts", "Handwritten records"].map((t, i) => (
          <div
            key={t}
            style={{
              fontFamily: FONTS.body,
              fontSize: 24,
              fontWeight: 500,
              color: COLORS.muted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              opacity: stagger(i),
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
