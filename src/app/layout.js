import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";                     // 전역 CSS
import "swiper/css";                        // ✅ Swiper 기본
import "swiper/css/navigation";             // ✅ 네비게이션 쓰면
import "swiper/css/pagination";          // ✅ 페이지네이션 쓰면

import ConditionalLayout from "./ConditionalLayout";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
    title: "대파 - 신선한 중고 거래",
    description: "믿을 수 있는 중고거래 플랫폼 대파에서 안전하고 편리하게 거래하세요",
};

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ConditionalLayout>{children}</ConditionalLayout>
        </body>
        </html>
    );
}
