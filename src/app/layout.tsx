import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import ConditionalLayout from "./ConditionalLayout";
import ThemeRegistry from "./ThemeRegistry";
import Script from "next/script";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
    title: "대파 - 신선한 중고 거래",
    description: "믿을 수 있는 중고거래 플랫폼 대파에서 안전하고 편리하게 거래하세요",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ko">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Script
            id="storage-shim"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
                __html: `
                try {
                  const noop = {
                    getItem: () => null,
                    setItem: () => {},
                    removeItem: () => {},
                    clear: () => {},
                    key: () => null,
                    get length() { return 0; }
                  };
                  // 스토리지 접근이 차단된 환경에서는 setItem이 던지므로 바로 대체
                  try { window.localStorage.setItem; } catch (e) { Object.defineProperty(window, "localStorage", { value: noop, configurable: true }); }
                  try { window.sessionStorage.setItem; } catch (e) { Object.defineProperty(window, "sessionStorage", { value: noop, configurable: true }); }
                  const suppress = (err) => {
                    const msg = err?.message || err?.reason || String(err || "");
                    return typeof msg === "string" && msg.includes("Access to storage is not allowed");
                  };
                  window.addEventListener("error", (ev) => { if (suppress(ev.error)) ev.preventDefault(); }, true);
                  window.addEventListener("unhandledrejection", (ev) => { if (suppress(ev.reason)) ev.preventDefault(); }, true);
                } catch {}
                `,
            }}
        />
        <ThemeRegistry>
            <ConditionalLayout>{children}</ConditionalLayout>
        </ThemeRegistry>
        </body>
        </html>
    );
}
