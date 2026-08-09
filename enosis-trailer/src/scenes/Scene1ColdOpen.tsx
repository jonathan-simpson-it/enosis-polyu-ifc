import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const Scene1ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();

  const line1 = {
    opacity: interpolate(frame, [6, 20], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
    translate: interpolate(frame, [6, 22], ["0px 40px", "0px 0px"], {
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
    translate: interpolate(frame, [34, 50], ["0px 40px", "0px 0px"], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  };

  const zoom = interpolate(frame, [0, 120], [1.06, 1], {
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
        scale: `${zoom}`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 128,
            letterSpacing: "-0.015em",
            color: COLORS.white,
            ...line1,
          }}
        >
          THE AGE OF AI
        </div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 128,
            letterSpacing: "-0.015em",
            color: COLORS.sageBright,
            ...line2,
          }}
        >
          HAS A PROBLEM
        </div>
      </div>
    </AbsoluteFill>
  );
};
