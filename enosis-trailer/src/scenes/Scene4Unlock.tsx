import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const Scene4Unlock: React.FC = () => {
  const frame = useCurrentFrame();

  const eyebrow = {
    opacity: interpolate(frame, [5, 18], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  };

  const line1 = {
    opacity: interpolate(frame, [18, 32], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
    translate: interpolate(frame, [18, 36], ["0px 30px", "0px 0px"], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  };

  const line2 = {
    opacity: interpolate(frame, [34, 48], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
    translate: interpolate(frame, [34, 52], ["0px 30px", "0px 0px"], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  };

  const underline = interpolate(frame, [60, 85], [0, 1], {
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
          fontFamily: FONTS.body,
          fontWeight: 600,
          fontSize: 30,
          letterSpacing: "0.22em",
          color: COLORS.sage,
          textTransform: "uppercase",
          marginBottom: 34,
          ...eyebrow,
        }}
      >
        Before AI can create value
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 108,
            color: COLORS.white,
            letterSpacing: "-0.01em",
            ...line1,
          }}
        >
          SOMEONE HAS TO
        </div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 108,
            color: COLORS.white,
            letterSpacing: "-0.01em",
            ...line2,
          }}
        >
          UNLOCK THE DATA FIRST
        </div>
        <div
          style={{
            marginTop: 22,
            width: 640,
            height: 5,
            borderRadius: 3,
            background: COLORS.sage,
            scale: `${underline} 1`,
            opacity: underline,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
