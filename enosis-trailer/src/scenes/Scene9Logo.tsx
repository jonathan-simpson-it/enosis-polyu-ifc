import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const Scene9Logo: React.FC = () => {
  const frame = useCurrentFrame();

  const eyebrow = {
    opacity: interpolate(frame, [6, 18], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  };

  const logo = {
    opacity: interpolate(frame, [18, 34], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
    letterSpacing: interpolate(frame, [18, 44], ["0.55em", "0.14em"], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  };

  const underline = interpolate(frame, [44, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const tagline = {
    opacity: interpolate(frame, [78, 94], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
    translate: interpolate(frame, [78, 96], ["0px 22px", "0px 0px"], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  };

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
          fontFamily: FONTS.body,
          fontWeight: 600,
          fontSize: 28,
          letterSpacing: "0.4em",
          color: COLORS.sage,
          textTransform: "uppercase",
          marginBottom: 30,
          ...eyebrow,
        }}
      >
        Introducing
      </div>

      <div
        style={{
          fontFamily: "Georgia, 'Times New Roman', Times, serif",
          fontSize: 200,
          fontWeight: 400,
          color: COLORS.white,
          textTransform: "uppercase",
          ...logo,
        }}
      >
        ENOSIS
      </div>

      <div
        style={{
          marginTop: 34,
          width: 780,
          height: 5,
          borderRadius: 3,
          background: COLORS.sage,
          scale: `${underline} 1`,
          opacity: underline,
        }}
      />

      <div
        style={{
          marginTop: 48,
          fontFamily: FONTS.body,
          fontSize: 32,
          fontWeight: 400,
          letterSpacing: "0.02em",
          color: "rgba(255,255,255,0.82)",
          maxWidth: 1400,
          textAlign: "center",
          ...tagline,
        }}
      >
        The missing layer between your documents and your AI
      </div>
    </AbsoluteFill>
  );
};
