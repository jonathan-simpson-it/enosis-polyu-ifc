import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { COLORS, FONTS } from "../theme";
import { Chip, Vignette } from "../components/effects";

const LINES: { at: number; text: string; indent: number }[] = [
  { at: 18, text: "{", indent: 0 },
  { at: 32, text: '"declaration": {', indent: 1 },
  { at: 46, text: '"declaration_number": "TSW-DEMO-AK31-0042",', indent: 2 },
  { at: 60, text: '"declarant_reference": "INV-2026-0715-0042",', indent: 2 },
  { at: 74, text: '"items": [', indent: 2 },
  { at: 88, text: '{ "description": "Portable laptop computers",', indent: 3 },
  { at: 100, text: '"hs_code": "8471.30.00", "quantity": 500 },', indent: 4 },
  { at: 114, text: '{ "description": "Solid-state storage drives",', indent: 3 },
  { at: 126, text: '"hs_code": "8523.51.00", "quantity": 1000 },', indent: 4 },
  { at: 140, text: '{ "description": "Electronic integrated circuits",', indent: 3 },
  { at: 152, text: '"hs_code": "8542.31.00", "quantity": 10000 }', indent: 4 },
  { at: 164, text: "]", indent: 2 },
  { at: 174, text: "}", indent: 1 },
  { at: 182, text: "}", indent: 0 },
];

export const Scene8Json: React.FC = () => {
  const frame = useCurrentFrame();

  const panel = {
    opacity: interpolate(frame, [6, 20], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
    scale: interpolate(frame, [6, 20], [1.04, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
  };

  const cursorBlink =
    Math.sin(frame * 0.28) > 0 ? 1 : 0.15;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 200,
          width: 1060,
          height: 660,
          borderRadius: 18,
          background: "#0b0d0c",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 40px 90px rgba(0,0,0,0.6)",
          overflow: "hidden",
          zIndex: 5,
          ...panel,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ width: 13, height: 13, borderRadius: 999, background: "#ff5f57" }} />
          <div style={{ width: 13, height: 13, borderRadius: 999, background: "#febc2e" }} />
          <div style={{ width: 13, height: 13, borderRadius: 999, background: "#28c840" }} />
          <span
            style={{
              marginLeft: 18,
              fontFamily: FONTS.mono,
              fontSize: 19,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
            }}
          >
            TSW JSON
          </span>
          <div style={{ marginLeft: "auto" }}>
            <Chip borderColor="rgba(74,222,128,0.5)" color={COLORS.emerald}>
              Export ready
            </Chip>
          </div>
        </div>

        <div
          style={{
            padding: "34px 40px",
            fontFamily: FONTS.mono,
            fontSize: 26,
            lineHeight: 1.75,
            color: COLORS.json,
          }}
        >
          {LINES.map((l) => (
            <div
              key={l.at + l.text}
              style={{
                paddingLeft: l.indent * 34,
                opacity: interpolate(frame, [l.at, l.at + 5], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              {l.text}
            </div>
          ))}
          <span
            style={{
              display: "inline-block",
              width: 15,
              height: 28,
              background: COLORS.sageBright,
              opacity: cursorBlink,
              verticalAlign: "middle",
              marginLeft: 4,
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 120,
          top: 330,
          display: "flex",
          flexDirection: "column",
          gap: 26,
          zIndex: 6,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 21,
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.6)",
            textTransform: "uppercase",
            opacity: interpolate(frame, [10, 22], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Output formats
        </div>
        {[
          { at: 60, f: "WCO JSON" },
          { at: 92, f: "WCO XML" },
          { at: 124, f: "TSW JSON" },
        ].map((r) => (
          <div
            key={r.f}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              opacity: interpolate(frame, [r.at, r.at + 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="rgba(74,222,128,0.14)" stroke="#4ade80" strokeWidth="1.6" />
              <path d="M7.5 12.5l3 3 6-6.5" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 27,
                color: COLORS.white,
                letterSpacing: "0.05em",
              }}
            >
              {r.f}
            </span>
          </div>
        ))}
        <div
          style={{
            marginTop: 18,
            maxWidth: 400,
            fontFamily: FONTS.body,
            fontSize: 23,
            lineHeight: 1.5,
            color: COLORS.muted,
            opacity: interpolate(frame, [150, 166], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Ready for trade single window, ERP and banking systems.
        </div>
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
