import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Img } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Chip, Flash, Vignette } from "../components/effects";
import { AppWindow } from "../components/ui/AppWindow";
import { StatusBadge, WarningIcon } from "../components/ui/primitives";
import { APP, APP_FONTS } from "../components/ui/tokens";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const ModuleName: React.FC<{ at: number; children: React.ReactNode }> = ({
  at,
  children,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: FONTS.display,
        fontSize: 86,
        color: COLORS.white,
        letterSpacing: "-0.01em",
        opacity: interpolate(frame, [at, at + 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        }),
        translate: interpolate(frame, [at, at + 16], ["0px 34px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        }),
      }}
    >
      {children}
    </div>
  );
};

const ModuleDesc: React.FC<{ at: number; children: React.ReactNode }> = ({
  at,
  children,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: FONTS.body,
        fontSize: 29,
        fontWeight: 400,
        lineHeight: 1.5,
        color: COLORS.muted,
        maxWidth: 720,
        opacity: interpolate(frame, [at + 6, at + 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        }),
      }}
    >
      {children}
    </div>
  );
};

const StatChip: React.FC<{ at: number; children: React.ReactNode }> = ({
  at,
  children,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: FONTS.mono,
        fontSize: 22,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: COLORS.sageBright,
        border: "1px solid rgba(128,152,143,0.55)",
        borderRadius: 999,
        padding: "10px 22px",
        opacity: interpolate(frame, [at, at + 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        }),
      }}
    >
      {children}
    </div>
  );
};

const DocFormerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const boxes = [
    { x: 60, y: 52, w: 300, h: 46, at: 16 },
    { x: 60, y: 128, w: 340, h: 20, at: 26 },
    { x: 60, y: 168, w: 240, h: 16, at: 34 },
    { x: 60, y: 216, w: 420, h: 210, at: 44 },
    { x: 60, y: 452, w: 260, h: 44, at: 54 },
  ];
  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", paddingLeft: 130, gap: 90 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, zIndex: 10 }}>
        <ModuleName at={8}>DocFormer-Trade</ModuleName>
        <ModuleDesc at={16}>
          A multimodal layout transformer that reads both the structure and the
          text of any trade document.
        </ModuleDesc>
        <StatChip at={38}>Beats LayoutLM by 14% on trade manifests</StatChip>
      </div>
      <div
        style={{
          position: "relative",
          width: 540,
          height: 540,
          borderRadius: 14,
          overflow: "hidden",
          background: "#101211",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Img
          src={staticFile("docs/invoice-1.jpg")}
          style={{ width: "100%", height: "100%", opacity: 0.55, filter: "grayscale(0.4)" }}
        />
        {boxes.map((b, i) => {
          const o = interpolate(frame, [b.at, b.at + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE,
          });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: b.x,
                top: b.y,
                width: b.w,
                height: b.h,
                border: `2px solid rgba(168,195,186,${0.5 + 0.5 * o})`,
                borderRadius: 6,
                background: `rgba(128,152,143,${0.1 * o})`,
                opacity: o,
                zIndex: 5,
              }}
            />
          );
        })}
        <div
          style={{
            position: "absolute",
            right: 20,
            bottom: 18,
            zIndex: 8,
            fontFamily: FONTS.mono,
            fontSize: 17,
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.65)",
            textTransform: "uppercase",
          }}
        >
          Layout + text
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ConfidenceBar: React.FC<{
  label: string;
  pct: number;
  at: number;
  color: string;
}> = ({ label, pct, at, color }) => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [at, at + 26], [0, pct], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 0.9, 0.3, 1),
  });
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        opacity: interpolate(frame, [at - 8, at + 4], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        }),
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", width: 480 }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 19,
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 19,
            fontWeight: 600,
            color,
          }}
        >
          {Math.round(fill)}%
        </span>
      </div>
      <div
        style={{
          width: 480,
          height: 16,
          borderRadius: 8,
          background: "rgba(255,255,255,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${fill}%`,
            height: "100%",
            borderRadius: 8,
            background: color,
            boxShadow: `0 0 18px ${color}66`,
          }}
        />
      </div>
    </div>
  );
};

const UncertaintyScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", paddingLeft: 130, gap: 100 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, zIndex: 10 }}>
        <ModuleName at={6}>UncertaintyGuard</ModuleName>
        <ModuleDesc at={14}>
          Split conformal prediction. It knows when it does not know, and
          flags low-confidence fields instead of guessing.
        </ModuleDesc>
        <StatChip at={30}>95% accuracy. Guaranteed.</StatChip>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
        <ConfidenceBar label="HS CODES" pct={97} at={34} color={COLORS.emerald} />
        <ConfidenceBar label="WEIGHTS" pct={94} at={52} color={COLORS.emerald} />
        <ConfidenceBar label="QUANTITIES" pct={78} at={70} color={COLORS.amber} />
      </div>
    </AbsoluteFill>
  );
};

const ChipInline: React.FC<{
  at: number;
  color: string;
  children: React.ReactNode;
}> = ({ at, color, children }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: FONTS.mono,
        fontSize: 26,
        color,
        border: `1px solid ${color}55`,
        borderRadius: 12,
        padding: "14px 24px",
        background: `${color}14`,
        opacity: interpolate(frame, [at, at + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        }),
        scale: interpolate(frame, [at, at + 10], [0.8, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        }),
      }}
    >
      {children}
    </div>
  );
};

const HierarchicalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const arrow = interpolate(frame, [34, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  return (
    <AbsoluteFill
      style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 46,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <ModuleName at={4}>HierarchicalHS</ModuleName>
        <ModuleDesc at={12}>
          Translates raw invoice items into standardised HS product codes.
        </ModuleDesc>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
          }}
        >
          <ChipInline at={16} color="#ffffff">
            RAW INVOICE ITEMS
          </ChipInline>
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 20,
              color: COLORS.muted,
              opacity: interpolate(frame, [22, 32], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Laptop computers
            <br />
            SSD storage drives
            <br />
            Processor ICs
          </span>
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 44,
            color: COLORS.sageBright,
            opacity: arrow,
            scale: `${arrow} 1`,
          }}
        >
          →
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ChipInline at={38} color={COLORS.sageBright}>
            8471.30.00
          </ChipInline>
          <ChipInline at={52} color={COLORS.sageBright}>
            8523.51.00
          </ChipInline>
          <ChipInline at={66} color={COLORS.sageBright}>
            8542.31.00
          </ChipInline>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const MetaSchemaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const formats = ["WCO JSON", "WCO XML", "TSW JSON"];
  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", paddingLeft: 130, gap: 110 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, zIndex: 10 }}>
        <ModuleName at={4}>MetaSchema</ModuleName>
        <ModuleDesc at={12}>
          A zero-shot schema mapper. Any document, any target format. No
          templates required.
        </ModuleDesc>
        <StatChip at={26}>Zero-shot schema mapping</StatChip>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 90,
            color: "rgba(168,195,186,0.9)",
            lineHeight: 1,
            opacity: interpolate(frame, [18, 30], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASE,
            }),
          }}
        >
          {"{ }"}
        </div>
        {formats.map((f, i) => (
          <div
            key={f}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: interpolate(frame, [30 + i * 10, 42 + i * 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: EASE,
              }),
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="rgba(74,222,128,0.14)" stroke="#4ade80" strokeWidth="1.6" />
              <path d="M7.5 12.5l3 3 6-6.5" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 26,
                color: COLORS.white,
                letterSpacing: "0.06em",
              }}
            >
              {f}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const ReviewScene: React.FC = () => {
  const frame = useCurrentFrame();
  const E = Easing.bezier(0.16, 1, 0.3, 1);

  const fade = (at: number, dur = 14) => ({
    opacity: interpolate(frame, [at, at + dur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E,
    }),
    translate: `0px ${interpolate(frame, [at, at + dur], [18, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E,
    })}px`,
  });

  const winIn = {
    opacity: interpolate(frame, [100, 114], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E,
    }),
    scale: interpolate(frame, [100, 116], [1.05, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: E,
    }),
  };

  const ROWS: {
    at: number;
    desc: string;
    hs: string;
    qty: string;
    value: string;
    origin: string;
    conf: number;
    flagged: boolean;
  }[] = [
    { at: 136, desc: "Portable laptop computers", hs: "8471.30.00", qty: "500", value: "USD 425,000", origin: "China", conf: 98, flagged: false },
    { at: 144, desc: "Solid-state storage drives", hs: "8523.51.00", qty: "1,000", value: "USD 89,000", origin: "China", conf: 96, flagged: false },
    { at: 152, desc: "Electronic integrated circuits", hs: "8542.31.00", qty: "10,000", value: "USD 125,000", origin: "Taiwan", conf: 78, flagged: true },
  ];

  const label = (t: string, v: string, mono = false) => (
    <div>
      <div
        style={{
          fontFamily: APP_FONTS.body,
          fontSize: 11,
          color: APP.muted,
          marginBottom: 3,
        }}
      >
        {t}
      </div>
      <div
        style={{
          fontFamily: mono ? APP_FONTS.mono : APP_FONTS.body,
          fontSize: 12.5,
          color: APP.ink,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {v}
      </div>
    </div>
  );

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 848,
          top: 200,
          width: 1010,
          height: 660,
          ...winIn,
        }}
      >
        <AppWindow
          width={1010}
          height={660}
          activeNav="/documents"
          url="app.enosis.hk/documents/demo-inv-001/review"
        >
          <div style={{ ...fade(110) }}>
            <div
              style={{
                fontFamily: APP_FONTS.mono,
                fontSize: 12,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: APP.accent,
                marginBottom: 8,
              }}
            >
              Document Review
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  fontFamily: APP_FONTS.display,
                  fontWeight: 600,
                  fontSize: 27,
                  letterSpacing: "-0.01em",
                  color: APP.ink,
                }}
              >
                invoice-sample.txt
              </div>
              <StatusBadge tone="amber">extracted</StatusBadge>
              <div
                style={{
                  fontFamily: APP_FONTS.body,
                  fontSize: 13.5,
                  color: APP.muted,
                }}
              >
                Avg confidence: 93%
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, ...fade(120) }}>
            <div
              style={{
                background: APP.surface,
                border: `1px solid ${APP.line}`,
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: APP_FONTS.body,
                    fontWeight: 600,
                    fontSize: 13,
                    color: APP.ink,
                  }}
                >
                  Declaration Info
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    height: 28,
                    padding: "0 12px",
                    borderRadius: 999,
                    background: APP.ink,
                    fontFamily: APP_FONTS.body,
                    fontWeight: 500,
                    fontSize: 11,
                    color: APP.surface,
                  }}
                >
                  Save
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "12px 18px",
                }}
              >
                {label("Consignor", "Shenzhen Electronics Trading")}
                {label("Consignee", "HK Logistics Ltd")}
                {label("Port of Loading", "SHEKOU")}
                {label("Port of Discharge", "HONG KONG")}
                {label("Incoterms", "FOB")}
                {label("Container", "MSCU4820137", true)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, ...fade(130) }}>
            <div
              style={{
                background: APP.surface,
                border: `1px solid ${APP.line}`,
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: APP_FONTS.body,
                    fontWeight: 600,
                    fontSize: 13,
                    color: APP.ink,
                  }}
                >
                  Commodities (3)
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    height: 28,
                    padding: "0 12px",
                    borderRadius: 999,
                    background: APP.ink,
                    fontFamily: APP_FONTS.body,
                    fontWeight: 500,
                    fontSize: 11,
                    color: APP.surface,
                  }}
                >
                  Save Changes
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "24px 1.7fr 1fr 56px 92px 56px 62px",
                  gap: "0 10px",
                  fontFamily: APP_FONTS.mono,
                  fontSize: 10.5,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: APP.muted,
                  paddingBottom: 8,
                  borderBottom: `1px solid ${APP.line}`,
                }}
              >
                <span>#</span>
                <span>Description</span>
                <span>HS Code</span>
                <span style={{ textAlign: "right" }}>Qty</span>
                <span style={{ textAlign: "right" }}>Value</span>
                <span>Origin</span>
                <span style={{ textAlign: "right" }}>Conf.</span>
              </div>
              {ROWS.map((r, i) => {
                const o = interpolate(frame, [r.at, r.at + 10], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: E,
                });
                return (
                  <div
                    key={r.hs}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "24px 1.7fr 1fr 56px 92px 56px 62px",
                      gap: "0 10px",
                      alignItems: "center",
                      padding: "7px 0",
                      borderBottom: i < ROWS.length - 1 ? `1px solid ${APP.line}` : "none",
                      fontFamily: APP_FONTS.body,
                      fontSize: 12,
                      color: APP.ink,
                      background: r.flagged ? "rgba(254,243,199,0.5)" : "transparent",
                      opacity: o,
                      translate: `0px ${interpolate(frame, [r.at, r.at + 10], [8, 0], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: E,
                      })}px`,
                    }}
                  >
                    <span style={{ fontFamily: APP_FONTS.mono, fontSize: 11, color: APP.muted }}>
                      {i + 1}
                    </span>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.desc}
                    </span>
                    <span style={{ fontFamily: APP_FONTS.mono, fontSize: 11.5 }}>{r.hs}</span>
                    <span style={{ textAlign: "right", fontFamily: APP_FONTS.mono, fontSize: 11.5 }}>
                      {r.qty}
                    </span>
                    <span style={{ textAlign: "right", fontFamily: APP_FONTS.mono, fontSize: 11.5 }}>
                      {r.value}
                    </span>
                    <span style={{ fontSize: 11.5 }}>{r.origin}</span>
                    <span style={{ textAlign: "right" }}>
                      <span
                        style={{
                          display: "inline-block",
                          borderRadius: 999,
                          padding: "2px 8px",
                          fontFamily: APP_FONTS.mono,
                          fontWeight: 600,
                          fontSize: 10.5,
                          color: r.flagged ? APP.amberText : APP.emerald,
                          background: r.flagged ? APP.amberSoft : APP.emeraldSoft,
                        }}
                      >
                        {r.conf}%
                      </span>
                    </span>
                  </div>
                );
              })}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: APP.amberSoft,
                  border: `1px solid ${APP.amberBorder}`,
                  opacity: interpolate(frame, [162, 172], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: E,
                  }),
                }}
              >
                <WarningIcon size={16} />
                <span
                  style={{
                    fontFamily: APP_FONTS.body,
                    fontWeight: 500,
                    fontSize: 12,
                    color: APP.amberText,
                  }}
                >
                  1 commodity flagged — only review the exceptions
                </span>
              </div>
            </div>
          </div>
        </AppWindow>
      </div>

      <div
        style={{
          position: "absolute",
          left: 84,
          top: 104,
          zIndex: 20,
          opacity: interpolate(frame, [106, 118], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: E,
          }),
        }}
      >
        <Chip>Confidence validation</Chip>
        <div
          style={{
            marginTop: 26,
            maxWidth: 620,
            fontFamily: FONTS.body,
            fontSize: 28,
            lineHeight: 1.55,
            color: COLORS.muted,
          }}
        >
          Every field is scored by UncertaintyGuard. Low-confidence rows are
          flagged for review.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Scene7Engine: React.FC = () => {
  const frame = useCurrentFrame();
  const inReview = frame >= 96 && frame < 180;
  const inMeta = frame >= 312;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      {frame < 96 && <DocFormerScene />}
      {frame >= 180 && frame < 246 && <UncertaintyScene />}
      {frame >= 246 && frame < 312 && <HierarchicalScene />}
      {frame >= 312 && <MetaSchemaScene />}

      {inReview && <ReviewScene />}

      {frame >= 180 && frame < 246 && (
        <div
          style={{
            position: "absolute",
            left: 130,
            bottom: 110,
            zIndex: 10,
            opacity: interpolate(frame, [210, 222], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 20,
              letterSpacing: "0.14em",
              color: COLORS.amber,
              textTransform: "uppercase",
            }}
          >
            Low-confidence fields are flagged for review
          </span>
        </div>
      )}

      {inMeta && <Flash at={316} duration={4} />}

      <Vignette />
    </AbsoluteFill>
  );
};
