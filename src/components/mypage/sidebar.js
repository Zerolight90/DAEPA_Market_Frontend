"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./sideNav.module.css";

export const SIDE_SECTIONS = [
    {
        title: "거래 정보",
        items: [
            { href: "/mypage/sell", label: "판매내역" },
            { href: "/mypage/buy", label: "구매내역" },
            { href: "/mypage/shipping", label: "택배" },
            { href: "/mypage/matching", label: "관심 상품 매칭" },
            { href: "/mypage/safe_settle", label: "안심결제 정산내역" },
        ],
    },
    {
        title: "내 정보",
        items: [
            // { href: "/mypage/account", label: "계좌 관리" },
            { href: "/mypage/address", label: "배송지 관리" },
            { href: "/mypage/review", label: "거래 후기" },
            { href: "/mypage/leave", label: "탈퇴하기" },
        ],
    },
];

export default function SideNav({ sections = SIDE_SECTIONS, currentPath }) {
    const pathname = currentPath || usePathname() || "";

    const isActive = (href) =>
        pathname === href || pathname.startsWith(href + "/");

    return (
        <aside className={styles.sidebar}>
            <nav className={styles.sideNav} aria-label="마이페이지 사이드바">
                <div className={styles.sideHeader}>마이페이지</div>

                {sections.map((section) => (
                    <section key={section.title} className={styles.sideSection}>
                        <h3 className={styles.sideTitle}>{section.title}</h3>
                        <ul className={styles.sideList}>
                            {section.items.map((it) => (
                                <li key={it.href}>
                                    <Link
                                        href={it.href}
                                        className={`${styles.sideLink} ${
                                            isActive(it.href) ? styles.active : ""
                                        }`}
                                    >
                                        {it.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </nav>
        </aside>
    );
}
