import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, staticFile } from "remotion";
import { CanvasImage } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Flash, Scanline, Vignette } from "../components/effects";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const SPRING = Easing.bezier(0.34, 1.3, 0.64, 1);

const PAPER_SIZE = 480;

const Paper: React.FC<{
  src: string;
  at: number;
  rotate: number;
  x: number;
  y: number;
  z: number;
  fromTop?: boolean;
}> = ({ src, at, rotate, x, y, z, fromTop }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  const appear = interpolate(t, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: fromTop ? Easing.out(Easing.cubic) : EASE,
  });
  const dropY = fromTop
    ? interpolate(t, [0, 18], [-700, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: SPRING,
      })
    : 0;
  const dropX = fromTop
    ? 0
    : interpolate(t, [0, 18], [fromTop ? 0 : x < 0 ? -700 : 700, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: SPRING,
      });
  const scale = interpolate(t, [0, 18], [1.35, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SPRING,
  });
  const sway = fromTop ? Math.sin(t * 0.05) * 2 : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: PAPER_SIZE,
        height: PAPER_SIZE,
        zIndex: z,
        opacity: appear,
        scale: `${scale}`,
        rotate: `${rotate + sway}deg`,
        translate: `${dropX}px ${dropY}px`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        filter: "saturate(0.95)",
      }}
    >
      <CanvasImage src={staticFile(src)} style={{ width: "100%", height: "100%", borderRadius: 6 }} />
    </div>
  );
};

export const Scene3Paper: React.FC = () => {
  const frame = useCurrentFrame();

  const flicker = (i: number) =>
    0.55 + 0.45 * Math.abs(Math.sin(frame * 0.12 + i * 2.1));

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <Paper src="docs/invoice-2.jpg" at={12} rotate={5} x={820} y={180} z={1} />
      <Paper src="docs/invoice-3.jpg" at={26} rotate={-6} x={300} y={140} z={1} />
      <Paper src="docs/invoice-1.jpg" at={0} rotate={-2} x={520} y={250} z={2} fromTop />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 520,
            top: 250,
            width: PAPER_SIZE,
            height: PAPER_SIZE,
            opacity: flicker(1),
            background: "transparent",
          }}
        />
      </div>

      <Flash at={58} duration={8} />
      <Scanline
        progress={interpolate(frame, [68, 150], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
      />

      <div
        style={{
          position: "absolute",
          top: 96,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 10,
          fontFamily: FONTS.mono,
          fontSize: 22,
          letterSpacing: "0.3em",
          color: COLORS.sageBright,
          textTransform: "uppercase",
          opacity: interpolate(frame, [80, 95], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE,
          }),
        }}
      >
        Thirty years of trade documents
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
