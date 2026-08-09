import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONTS } from "../theme";

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse 95% 85% at 50% 50%, transparent 52%, rgba(0,0,0,0.55) 100%)",
    }}
  />
);

export const Flash: React.FC<{
  at: number;
  duration?: number;
  color?: string;
}> = ({ at, duration = 7, color = "#ffffff" }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [at - 1, at, at + duration, at + duration + 1],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill
      style={{ backgroundColor: color, opacity, zIndex: 60, pointerEvents: "none" }}
    />
  );
};

export const Scanline: React.FC<{
  progress: number;
  color?: string;
}> = ({ progress, color = "rgba(168,195,186,0.95)" }) => {
  return (
    <AbsoluteFill style={{ zIndex: 20, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          transform: `translateY(${progress * 100}%)`,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          boxShadow: `0 0 24px 6px rgba(128,152,143,0.5)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const Chip: React.FC<{
  children: React.ReactNode;
  color?: string;
  borderColor?: string;
}> = ({ children, color = "rgba(255,255,255,0.75)", borderColor = "rgba(255,255,255,0.28)" }) => (
  <div
    style={{
      fontFamily: FONTS.mono,
      fontSize: 21,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color,
      border: `1px solid ${borderColor}`,
      borderRadius: 999,
      padding: "9px 20px",
      background: "rgba(255,255,255,0.06)",
      backdropFilter: "blur(4px)",
    }}
  >
    {children}
  </div>
);

export const fadeUp = (frame: number, at: number, dur = 12, ease = Easing.bezier(0.16, 1, 0.3, 1)) => ({
  opacity: interpolate(frame, [at, at + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  }),
  translate: interpolate(frame, [at, at + dur], ["0px 26px", "0px 0px"], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  }),
});
