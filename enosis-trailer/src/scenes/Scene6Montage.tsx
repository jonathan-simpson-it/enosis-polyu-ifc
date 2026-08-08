import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  Video,
} from "remotion";
import { COLORS, FONTS } from "../theme";
import { Chip, Flash, Vignette } from "../components/effects";

export const Scene6Montage: React.FC = () => {
  const frame = useCurrentFrame();

  const title = {
    opacity: interpolate(frame, [14, 28], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
    translate: interpolate(frame, [14, 30], ["0px 30px", "0px 0px"], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
  };

  const zoom = interpolate(frame, [0, 180], [1, 1.07], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <AbsoluteFill style={{ scale: `${zoom}` }}>
        <Video
          src={staticFile("demo/clip-upload.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(5,5,5,0.75) 0%, rgba(5,5,5,0.15) 30%, rgba(5,5,5,0.15) 62%, rgba(5,5,5,0.85) 100%)",
        }}
      />

      <Flash at={0} duration={5} />

      <div
        style={{
          position: "absolute",
          left: 84,
          top: 108,
          zIndex: 20,
          ...title,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 96,
            color: COLORS.white,
            letterSpacing: "-0.01em",
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          AUTOMATIC EXTRACTION
        </div>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 14,
            alignItems: "center",
          }}
        >
          <Chip>Real app</Chip>
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 24,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.08em",
            }}
          >
            NATIVE FILE PICKER
          </span>
        </div>
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
