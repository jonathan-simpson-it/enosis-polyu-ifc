import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  staticFile,
} from "remotion";
import { CanvasImage } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Chip, Flash, Vignette } from "../components/effects";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const start = { x: 600, y: 480 };
const end = { x: 1450, y: 540 };

const Cursor: React.FC<{ x: number; y: number; opacity?: number }> = ({
  x,
  y,
  opacity = 1,
}) => (
  <div style={{ position: "absolute", left: x, top: y, opacity, zIndex: 50 }}>
    <svg width="34" height="40" viewBox="0 0 24 28" fill="none">
      <path
        d="M1.5 1.5 L1.5 19.5 L6 15.8 L8.8 23 L12 21.8 L9.2 14.6 L15.6 14.2 Z"
        fill="#ffffff"
        stroke="#000000"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const MacDocIcon: React.FC<{ opacity: number; scale: number }> = ({
  opacity,
  scale,
}) => (
  <div
    style={{
      position: "relative",
      width: 190,
      height: 238,
      borderRadius: 26,
      background: "linear-gradient(180deg, #ffffff 0%, #eef0ea 100%)",
      boxShadow: "0 24px 50px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.9)",
      opacity,
      scale: `${scale}`,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 52,
        height: 52,
        background: "linear-gradient(225deg, #e3e6df 0%, #e3e6df 48%, #cfd4cb 50%, #cfd4cb 100%)",
        clipPath: "polygon(0 0, 100% 100%, 0 100%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 26,
        top: 34,
        width: 138,
        height: 12,
        borderRadius: 6,
        background: "#c9cdc4",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 26,
        top: 62,
        width: 118,
        height: 12,
        borderRadius: 6,
        background: "#d5d9d1",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 26,
        top: 90,
        width: 128,
        height: 12,
        borderRadius: 6,
        background: "#d5d9d1",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 26,
        top: 118,
        width: 82,
        height: 12,
        borderRadius: 6,
        background: "#d5d9d1",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 62,
        top: 166,
        width: 66,
        height: 26,
        borderRadius: 999,
        background: COLORS.sageSoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.12em",
          color: "#5c6f67",
        }}
      >
        PDF
      </span>
    </div>
  </div>
);

const Dropzone: React.FC<{ highlight: number; active: number }> = ({
  highlight,
  active,
}) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [70, 88], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const on = interpolate(frame, [highlight, highlight + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const filled = interpolate(frame, [active, active + 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 1130,
        top: 280,
        width: 640,
        height: 520,
        borderRadius: 24,
        background: "rgba(244,244,239,0.97)",
        border: `4px dashed ${on > 0 ? COLORS.sage : "rgba(214,216,209,0.9)"}`,
        opacity: appear,
        scale: `${1 + (1 - filled) * 0.02}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        zIndex: 5,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: COLORS.sageSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#5c6f67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V4" />
          <path d="M6 10l6-6 6 6" />
          <path d="M4 20h16" />
        </svg>
      </div>
      <div
        style={{
          fontFamily: FONTS.body,
          fontWeight: 600,
          fontSize: 24,
          color: COLORS.ink,
        }}
      >
        Drop your file here or click to browse
      </div>
      <div
        style={{
          fontFamily: FONTS.body,
          fontSize: 17,
          color: COLORS.muted,
        }}
      >
        PDF, Excel, Image, JSON, CSV, or TXT, up to 20MB
      </div>
    </div>
  );
};

const Spinner: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const frame = useCurrentFrame();
  const r = interpolate(frame % 50, [0, 50], [0, 360], {
    extrapolateRight: "extend",
  });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ rotate: `${r}deg` }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeOpacity="0.2" strokeWidth="3.4" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        fill="none"
        stroke={color}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const Scene5DragDrop: React.FC = () => {
  const frame = useCurrentFrame();

  const morph = interpolate(frame, [45, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const drag = interpolate(frame, [100, 165], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const cx = interpolate(drag, [0, 1], [start.x, end.x]);
  const cy = interpolate(drag, [0, 1], [start.y, end.y]) + Math.sin(drag * Math.PI) * -46;

  const dropFade = interpolate(frame, [165, 178], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dropScale = interpolate(frame, [165, 178], [1, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const chipAt = 180;
  const uploadProgress = interpolate(frame, [180, 214], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.6, 0.4, 1),
  });

  const previewAt = 210;
  const previewAppear = interpolate(frame, [previewAt, previewAt + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const extractProgress = interpolate(frame, [225, 292], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 0.9, 0.3, 1),
  });

  const done = frame >= 290 ? 1 : 0;
  const statusLine = (at: number) =>
    interpolate(frame, [at, at + 6], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    });

  const scan = interpolate(frame, [228, 286], [0, 0.92], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <Dropzone highlight={95} active={165} />

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
        <div
          style={{
            position: "absolute",
            left: start.x - 170,
            top: start.y - 170,
            width: 340,
            height: 340,
            opacity: 1 - morph,
            rotate: "-2deg",
            scale: `${interpolate(frame, [0, 8], [1.08, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASE,
            })}`,
            boxShadow: "0 30px 70px rgba(0,0,0,0.7)",
            zIndex: 4,
          }}
        >
          <CanvasImage src={staticFile("docs/invoice-1.jpg")} style={{ width: "100%", height: "100%", borderRadius: 8 }} />
        </div>

        <div
          style={{
            position: "absolute",
            left: cx - 95,
            top: cy - 119,
            zIndex: 40,
            opacity: morph * dropFade,
            scale: `${morph * dropScale}`,
            rotate: `${2.5 * drag}deg`,
            translate: `${0}px ${6 * drag}px`,
          }}
        >
          <MacDocIcon opacity={1} scale={1} />
        </div>

        <div
          style={{
            position: "absolute",
            left: cx + 118,
            top: cy - 168,
            zIndex: 50,
            opacity: morph * interpolate(frame, [100, 112], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }) * dropFade,
          }}
        >
          <Cursor x={0} y={0} />
        </div>
      </div>

      <Flash at={163} duration={6} />

      <div
        style={{
          position: "absolute",
          left: end.x - 230,
          top: end.y - 76,
          width: 460,
          zIndex: 45,
          opacity: interpolate(frame, [chipAt, chipAt + 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE,
          }),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "rgba(22,23,20,0.92)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 14,
            padding: "14px 22px",
          }}
        >
          <Spinner size={26} color={COLORS.sageBright} />
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 21,
              color: COLORS.white,
              letterSpacing: "0.04em",
            }}
          >
            INV-2026-0715-0042.pdf
          </span>
        </div>
        <div
          style={{
            width: 320,
            height: 8,
            borderRadius: 4,
            background: "rgba(255,255,255,0.14)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${uploadProgress}%`,
              height: "100%",
              borderRadius: 4,
              background: COLORS.sage,
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 620,
          top: 250,
          width: 720,
          height: 560,
          borderRadius: 22,
          background: "rgba(244,244,239,0.98)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.65)",
          zIndex: 8,
          opacity: previewAppear,
          scale: `${interpolate(frame, [previewAt, previewAt + 14], [1.06, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE,
          })}`,
          overflow: "hidden",
          padding: 34,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Spinner size={20} color={COLORS.sage} />
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 19,
                letterSpacing: "0.22em",
                color: COLORS.ink,
                textTransform: "uppercase",
              }}
            >
              Extracting fields
            </span>
          </div>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 34,
              fontWeight: 600,
              color: COLORS.sage,
            }}
          >
            {Math.round(extractProgress)}%
          </span>
        </div>

        <div
          style={{
            position: "relative",
            width: 360,
            height: 360,
            borderRadius: 10,
            overflow: "hidden",
            background: "#eceee8",
          }}
        >
          <CanvasImage
            src={staticFile("docs/invoice-1.jpg")}
            style={{ width: "100%", height: "100%", opacity: 0.96 }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 4,
              transform: `translateY(${scan * 360}px)`,
              background: `linear-gradient(90deg, transparent, rgba(128,152,143,0.95), transparent)`,
              boxShadow: "0 0 22px 5px rgba(128,152,143,0.5)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "3px solid rgba(128,152,143,0.8)",
              borderRadius: 10,
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: 470,
            top: 150,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {[
            { at: 232, t: "DocFormer-Trade: layout analyzed" },
            { at: 252, t: "UncertaintyGuard: confidence scored" },
            { at: 272, t: "MetaSchema: schema mapped" },
          ].map((l) => (
            <div
              key={l.t}
              style={{
                fontFamily: FONTS.mono,
                fontSize: 18,
                color: COLORS.muted,
                opacity: statusLine(l.at),
              }}
            >
              {l.t}
            </div>
          ))}
          <div
            style={{
              marginTop: 18,
              opacity: done,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="rgba(74,222,128,0.14)" stroke="#4ade80" strokeWidth="1.6" />
              <path d="M7.5 12.5l3 3 6-6.5" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 19,
                letterSpacing: "0.16em",
                color: COLORS.ink,
                textTransform: "uppercase",
              }}
            >
              Extraction complete
            </span>
            <span
              style={{
                fontFamily: FONTS.body,
                fontSize: 17,
                color: COLORS.muted,
              }}
            >
              3 low-confidence fields flagged for review
            </span>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 34,
            right: 34,
            bottom: 26,
            height: 9,
            borderRadius: 5,
            background: "#e2e5dd",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${extractProgress}%`,
              height: "100%",
              borderRadius: 5,
              background: "linear-gradient(90deg, #80988f, #a8c3ba)",
            }}
          />
        </div>
      </div>

      <div style={{ position: "absolute", left: 64, top: 60, zIndex: 30 }}>
        <Chip>Enosis engine</Chip>
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
