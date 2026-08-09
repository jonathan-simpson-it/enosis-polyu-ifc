import React from "react";
import { staticFile } from "remotion";
import { Img } from "remotion";
import { APP, APP_FONTS } from "./tokens";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Upload Document", href: "/upload", icon: "upload" },
  { label: "Documents", href: "/documents", icon: "doc" },
  { label: "Exports", href: "/exports", icon: "download" },
  { label: "Settings", href: "/settings", icon: "gear" },
] as const;

const NAV_ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5.5" rx="1.5" />
      <rect x="13.5" y="12" width="7" height="8.5" rx="1.5" />
      <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4" />
      <path d="M6 10l6-6 6 6" />
      <path d="M4 20h16" />
    </>
  ),
  doc: (
    <>
      <path d="M6 2.5h7.5L18 7v14.5H6z" />
      <path d="M9 12h6M9 15.5h6" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v12" />
      <path d="M6 10l6 6 6-6" />
      <path d="M4 20h16" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
    </>
  ),
};

const Icon: React.FC<{ name: string; active: boolean; size?: number }> = ({
  name,
  active,
  size = 20,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? APP.accent : APP.muted}
    strokeWidth={active ? 2.3 : 1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {NAV_ICONS[name]}
  </svg>
);

export const Sidebar: React.FC<{ active: string }> = ({ active }) => (
  <div
    style={{
      width: 232,
      flexShrink: 0,
      background: APP.surface,
      borderRight: `1px solid ${APP.line}`,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "22px 24px",
        borderBottom: `1px solid ${APP.line}`,
      }}
    >
      <Img
        src={staticFile("logo/enosis-mark.png")}
        style={{ width: 32, height: 32, borderRadius: 6 }}
      />
      <div>
        <div
          style={{
            fontFamily: APP_FONTS.body,
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: "-0.01em",
            color: APP.ink,
          }}
        >
          Enosis
        </div>
        <div
          style={{
            fontFamily: APP_FONTS.body,
            fontSize: 11,
            color: APP.muted,
          }}
        >
          Data Ingestion Engine
        </div>
      </div>
    </div>
    <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === active;
        return (
          <div
            key={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "11px 14px",
              borderRadius: 12,
              fontFamily: APP_FONTS.body,
              fontWeight: 500,
              fontSize: 14,
              color: isActive ? APP.accent : APP.muted,
              background: isActive ? APP.accentSoft : "transparent",
            }}
          >
            <Icon name={item.icon} active={isActive} />
            {item.label}
          </div>
        );
      })}
    </div>
    <div style={{ padding: "14px 24px", borderTop: `1px solid ${APP.line}` }}>
      <div
        style={{
          fontFamily: APP_FONTS.body,
          fontSize: 14,
          color: APP.muted,
        }}
      >
        Sign Out
      </div>
    </div>
  </div>
);

const TitleBar: React.FC<{ url: string }> = ({ url }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 9,
      height: 44,
      padding: "0 16px",
      background: "#ecece6",
      borderBottom: `1px solid ${APP.line}`,
      flexShrink: 0,
    }}
  >
    <div style={{ width: 12, height: 12, borderRadius: 999, background: "#ff5f57" }} />
    <div style={{ width: 12, height: 12, borderRadius: 999, background: "#febc2e" }} />
    <div style={{ width: 12, height: 12, borderRadius: 999, background: "#28c840" }} />
    <div
      style={{
        flex: 1,
        margin: "0 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: APP_FONTS.mono,
          fontSize: 12.5,
          letterSpacing: "0.03em",
          color: "#8a8d85",
          background: APP.surface,
          border: `1px solid ${APP.line}`,
          borderRadius: 999,
          padding: "5px 18px",
          maxWidth: 480,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {url}
      </div>
    </div>
  </div>
);

export const AppWindow: React.FC<{
  width: number;
  height: number;
  activeNav: string;
  url: string;
  sidebar?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, height, activeNav, url, sidebar = true, children, style }) => (
  <div
    style={{
      position: "absolute",
      width,
      height,
      borderRadius: 18,
      overflow: "hidden",
      background: APP.bg,
      border: "1px solid rgba(255,255,255,0.14)",
      boxShadow: "0 60px 140px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,0,0,0.4)",
      display: "flex",
      flexDirection: "column",
      zIndex: 10,
      ...style,
    }}
  >
    <TitleBar url={url} />
    <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
      {sidebar && <Sidebar active={activeNav} />}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          position: "relative",
          padding: sidebar ? "34px 40px" : "34px 40px",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  </div>
);
