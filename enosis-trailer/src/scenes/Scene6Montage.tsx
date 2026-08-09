import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { COLORS, FONTS } from "../theme";
import { Chip, Flash, Vignette } from "../components/effects";
import { AppWindow } from "../components/ui/AppWindow";
import {
  Cursor,
  PageHeader,
  DropzoneCard,
  PdfFileCard,
  CheckCircle,
} from "../components/ui/primitives";
import { APP, APP_FONTS } from "../components/ui/tokens";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const WINDOW = { width: 1180, height: 760, left: 610, top: 160 };

const Spinner: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const frame = useCurrentFrame();
  const r = ((frame % 50) / 50) * 360;
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

export const Scene6Montage: React.FC = () => {
  const frame = useCurrentFrame();

  const title = {
    opacity: interpolate(frame, [14, 28], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
    translate: interpolate(frame, [14, 30], ["0px 30px", "0px 0px"], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  };

  const zoom = interpolate(frame, [0, 180], [1, 1.07], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const windowIn = {
    opacity: interpolate(frame, [4, 16], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
    scale: interpolate(frame, [4, 18], [0.94, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    }),
  };

  const headerIn = interpolate(frame, [10, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const dropIn = interpolate(frame, [18, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  // Drag path (window-relative, overlay coords = content-area outer box)
  // content: 948 wide, header ~96 + 26 gap, dropzone 868x244 centered at x=474
  const dragStart = { x: 150, y: 160 };
  const dropCenter = { x: 474, y: 322 };
  const drag = interpolate(frame, [34, 96], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const cx = interpolate(drag, [0, 1], [dragStart.x, dropCenter.x]);
  const cy =
    interpolate(drag, [0, 1], [dragStart.y, dropCenter.y]) +
    Math.sin(drag * Math.PI) * -22;

  const dropFlash = interpolate(frame, [92, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardFade = interpolate(frame, [96, 108], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardScale = interpolate(frame, [96, 108], [1, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const highlight = interpolate(frame, [30, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) - interpolate(frame, [96, 104], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chipIn = interpolate(frame, [104, 116], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const chipOut = interpolate(frame, [128, 136], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const uploadProgress = interpolate(frame, [106, 132], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.6, 0.4, 1),
  });

  const successIn = interpolate(frame, [124, 138], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const ctaPulse = 1 + 0.045 * Math.sin(Math.max(0, frame - 140) * 0.22);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <AbsoluteFill style={{ scale: `${zoom}` }}>
        <div
          style={{
            position: "absolute",
            left: WINDOW.left,
            top: WINDOW.top,
            width: WINDOW.width,
            height: WINDOW.height,
            ...windowIn,
          }}
        >
          <AppWindow
            width={WINDOW.width}
            height={WINDOW.height}
            activeNav="/upload"
            url="app.enosis.hk/upload"
          >
            <div
              style={{
                opacity: headerIn,
                translate: `0px ${interpolate(frame, [10, 24], [16, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: EASE,
                })}px`,
              }}
            >
              <PageHeader
                label="Upload"
                title="Upload Trade Document"
                subtitle="PDF invoices, Excel packing lists, or scanned documents"
              />
            </div>

            <div
              style={{
                marginTop: 26,
                opacity: dropIn,
                scale: `${interpolate(frame, [18, 32], [1.03, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: EASE,
                })}`,
              }}
            >
              <DropzoneCard highlight={highlight} />
            </div>

            {/* drag overlay (window-relative) */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <div
                style={{
                  position: "absolute",
                  left: cx - 44,
                  top: cy - 58,
                  opacity: interpolate(frame, [30, 38], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }) * cardFade,
                  scale: `${0.9 * cardScale}`,
                  rotate: `${4 * drag}deg`,
                }}
              >
                <PdfFileCard width={88} />
              </div>
              <Cursor x={cx + 6} y={cy - 8} opacity={interpolate(frame, [30, 38], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }) * cardFade} />

              {dropFlash > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: 40,
                    top: 196,
                    width: 868,
                    height: 244,
                    borderRadius: 16,
                    boxShadow: `inset 0 0 60px 12px rgba(128,152,143,${0.5 * dropFlash})`,
                    border: "3px solid rgba(128,152,143,0.75)",
                    opacity: dropFlash,
                  }}
                />
              )}

              {/* upload toast */}
              <div
                style={{
                  position: "absolute",
                  right: 36,
                  top: 30,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "rgba(22,23,20,0.94)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 14,
                  padding: "13px 20px",
                  opacity: chipIn * chipOut,
                  translate: `0px ${interpolate(frame, [104, 116], [10, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: EASE,
                  })}px`,
                }}
              >
                <Spinner size={24} color={COLORS.sageBright} />
                <div>
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 16,
                      color: COLORS.white,
                      letterSpacing: "0.04em",
                    }}
                  >
                    INV-2026-0715-0042.pdf
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      width: 190,
                      height: 6,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.14)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: "100%",
                        borderRadius: 3,
                        background: COLORS.sage,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* success card */}
            <div
              style={{
                position: "absolute",
                left: 40,
                right: 40,
                top: 458,
                opacity: successIn,
                scale: `${interpolate(frame, [124, 138], [1.04, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: EASE,
                })}`,
                translate: `0px ${interpolate(frame, [124, 138], [24, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: EASE,
                })}px`,
              }}
            >
              <div
                style={{
                  background: "rgba(236,253,245,0.85)",
                  border: "1px solid #a7f3d0",
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "#d1fae5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle size={22} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: APP_FONTS.body,
                        fontWeight: 600,
                        fontSize: 16,
                        color: "#065f46",
                      }}
                    >
                      Upload Successful
                    </div>
                    <div
                      style={{
                        fontFamily: APP_FONTS.body,
                        fontSize: 12.5,
                        color: "#047857",
                      }}
                    >
                      invoice-sample.txt
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px 24px",
                    fontFamily: APP_FONTS.body,
                    fontSize: 13,
                    marginBottom: 18,
                  }}
                >
                  {[
                    ["Declaration ID", "demo-inv-001"],
                    ["Type", "invoice"],
                    ["Characters", "1,284"],
                    ["Tables detected", "Yes"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: APP.muted }}>{k}:</span>
                      <span
                        style={{
                          color: APP.ink,
                          fontFamily: k === "Declaration ID" ? APP_FONTS.mono : APP_FONTS.body,
                          fontSize: 12.5,
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 40,
                      padding: "0 20px",
                      borderRadius: 999,
                      fontFamily: APP_FONTS.body,
                      fontWeight: 600,
                      fontSize: 13,
                      color: APP.surface,
                      background: "#059669",
                      scale: `${ctaPulse}`,
                    }}
                  >
                    Review &amp; Process
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 40,
                      padding: "0 20px",
                      borderRadius: 999,
                      fontFamily: APP_FONTS.body,
                      fontWeight: 500,
                      fontSize: 13,
                      color: APP.ink,
                      background: APP.surface,
                      border: `1px solid ${APP.line}`,
                    }}
                  >
                    View All Documents
                  </div>
                </div>
              </div>
            </div>
          </AppWindow>
        </div>

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

        <Flash at={0} duration={5} />
        <Vignette />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
