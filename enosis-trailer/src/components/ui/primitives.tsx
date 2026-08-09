import React from "react";
import { APP, APP_FONTS } from "./tokens";

export const UploadIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 26,
  color = APP.muted,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 16V4" />
    <path d="M6 10l6-6 6 6" />
    <path d="M4 20h16" />
  </svg>
);

export const CheckCircle: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = APP.emerald,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill={color} opacity="0.14" />
    <path d="M7.5 12.5l3 3 6-6.5" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WarningIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = APP.amberText,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill={color} opacity="0.12" />
    <path d="M12 7.5v5.5" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
    <circle cx="12" cy="16.4" r="1.3" fill={color} />
  </svg>
);

export const PageHeader: React.FC<{
  label: string;
  title: string;
  subtitle: string;
}> = ({ label, title, subtitle }) => (
  <div>
    <div
      style={{
        fontFamily: APP_FONTS.mono,
        fontSize: 13,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: APP.accent,
        marginBottom: 10,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: APP_FONTS.display,
        fontWeight: 600,
        fontSize: 34,
        letterSpacing: "-0.01em",
        color: APP.ink,
      }}
    >
      {title}
    </div>
    <div
      style={{
        marginTop: 8,
        fontFamily: APP_FONTS.body,
        fontSize: 15,
        color: APP.muted,
      }}
    >
      {subtitle}
    </div>
  </div>
);

export const StatusBadge: React.FC<{
  tone: "amber" | "emerald" | "muted";
  children: React.ReactNode;
}> = ({ tone, children }) => {
  const c =
    tone === "amber"
      ? { bg: APP.amberSoft, text: APP.amberText }
      : tone === "emerald"
        ? { bg: APP.emeraldSoft, text: APP.emerald }
        : { bg: APP.accentSoft, text: APP.accent };
  return (
    <div
      style={{
        display: "inline-block",
        fontFamily: APP_FONTS.body,
        fontWeight: 500,
        fontSize: 13,
        color: c.text,
        background: c.bg,
        borderRadius: 999,
        padding: "4px 12px",
        textTransform: "capitalize",
      }}
    >
      {children}
    </div>
  );
};

export const Button: React.FC<{
  kind?: "primary" | "secondary";
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ kind = "primary", children, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      height: 44,
      padding: "0 24px",
      borderRadius: 999,
      fontFamily: APP_FONTS.body,
      fontWeight: 600,
      fontSize: 13,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: kind === "primary" ? APP.surface : APP.ink,
      background: kind === "primary" ? APP.ink : APP.surface,
      border: kind === "primary" ? "none" : `1px solid ${APP.line}`,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: APP.surface,
      border: `1px solid ${APP.line}`,
      borderRadius: 16,
      padding: 24,
      ...style,
    }}
  >
    {children}
  </div>
);

export const DropzoneCard: React.FC<{
  highlight: number;
  style?: React.CSSProperties;
}> = ({ highlight, style }) => (
  <div
    style={{
      position: "relative",
      borderRadius: 16,
      border: `2px dashed ${highlight > 0 ? APP.accent : APP.line}`,
      background: highlight > 0 ? "rgba(227,233,230,0.55)" : APP.surface,
      padding: "64px 40px",
      textAlign: "center",
      ...style,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 56,
        height: 56,
        borderRadius: 12,
        background: APP.accentSoft,
        margin: "0 auto 16px",
      }}
    >
      <UploadIcon size={26} color={highlight > 0 ? APP.accent : APP.muted} />
    </div>
    <div
      style={{
        fontFamily: APP_FONTS.body,
        fontWeight: 500,
        fontSize: 16,
        color: APP.ink,
        marginBottom: 6,
      }}
    >
      Drop your file here or click to browse
    </div>
    <div
      style={{
        fontFamily: APP_FONTS.body,
        fontSize: 13.5,
        color: APP.muted,
      }}
    >
      PDF, Excel, Image, JSON, CSV, or TXT, up to 4MB (images are compressed
      automatically)
    </div>
  </div>
);

export const Cursor: React.FC<{ x: number; y: number; opacity?: number }> = ({
  x,
  y,
  opacity = 1,
}) => (
  <div style={{ position: "absolute", left: x, top: y, opacity, zIndex: 60 }}>
    <svg width="30" height="36" viewBox="0 0 24 28" fill="none">
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

export const PdfFileCard: React.FC<{
  width?: number;
  opacity?: number;
}> = ({ width = 96, opacity = 1 }) => (
  <div
    style={{
      position: "relative",
      width,
      height: width * 1.25,
      borderRadius: Math.round(width * 0.13),
      background: "linear-gradient(180deg, #ffffff 0%, #eef0ea 100%)",
      boxShadow: "0 14px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.9)",
      opacity,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: width * 0.27,
        height: width * 0.27,
        background:
          "linear-gradient(225deg, #e3e6df 0%, #e3e6df 48%, #cfd4cb 50%, #cfd4cb 100%)",
        clipPath: "polygon(0 0, 100% 100%, 0 100%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: width * 0.14,
        top: width * 0.18,
        width: width * 0.72,
        height: width * 0.065,
        borderRadius: 4,
        background: "#c9cdc4",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: width * 0.14,
        top: width * 0.33,
        width: width * 0.6,
        height: width * 0.065,
        borderRadius: 4,
        background: "#d5d9d1",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: width * 0.14,
        top: width * 0.48,
        width: width * 0.66,
        height: width * 0.065,
        borderRadius: 4,
        background: "#d5d9d1",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: width * 0.32,
        top: width * 0.87,
        width: width * 0.36,
        height: width * 0.14,
        borderRadius: 999,
        background: APP.accentSoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: APP_FONTS.mono,
          fontSize: width * 0.07,
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
