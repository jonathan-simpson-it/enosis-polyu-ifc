import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Enosis | Universal Document Intelligence Engine",
  description:
    "Translate any trade document into TSW-compliant schemas. PDF invoices, Excel packing lists, or WeChat screenshots, one click to WCO XML.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <div className="site-gradient" />
        <Nav />
        {children}
      </body>
    </html>
  );
}
