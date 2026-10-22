import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./trading.css";
import { TradingNav } from "@/components/trading/TradingNav";

export const metadata: Metadata = {
  title: "Deep Bridge | B2B Recommendation Engine",
  description: "Explainable product recommendations for overseas buyers",
};

export default function DeepBridgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TradingNav />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </>
  );
}
