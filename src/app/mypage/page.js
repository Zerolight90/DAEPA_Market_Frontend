'use client';

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./mypage.module.css";
import tokenStore from "@/app/store/TokenStore";

const SIDE_SECTIONS = [
    {
        title: "거래 정보",
        items: [
            { href: "/mypage/sell", label: "판매내역" },
            { href: "/mypage/buy", label: "구매내역" },
            { href: "/mypage/shipping", label: "택배" },
            { href: "/mypage/matching", label: "관심 상품 매칭" },
            { href: "/mypage/safe-settle", label: "안심결제 정산내역" },
        ],
    },
    {
        title: "내 정보",
        items: [
            { href: "/mypage/account", label: "계좌 관리" },
            { href: "/mypage/address", label: "배송지 관리" },
            { href: "/mypage/review", label: "거래 후기" },
            { href: "/mypage/leave", label: "탈퇴하기" },
        ],
    },
];

const METRICS = [
    { key: "safe", label: "안심결제", value: 0 },
    { key: "review", label: "거래후기", value: 0 },
    { key: "close", label: "단골", value: 0 },
    { key: "eco", label: "에코마일", value: "0 M" },
];

// 탭: 전체 / 판매중(0) / 판매완료(1)
const TABS = [
    { key: "all", label: "전체" },
    { key: "selling", label: "판매중" }, // status=0
    { key: "sold", label: "판매완료" },  // status=1
];

const SORTS = [
    { key: "latest", label: "최신순" },
    { key: "low", label: "낮은가격순" },
    { key: "high", label: "높은가격순" },
];

export default function MyPage() {
    const pathname = usePathname();
    const { accessToken } = tokenStore();

    const [tab, setTab] = useState("all");
    const [sort, setSort] = useState("latest");

    const [myInfo, setMyInfo] = useState({
        nickname: "로딩 중...",
        trust: 0,
        avatarUrl: "",
    });

    const [items, setItems] = useState([]);

    // 1) 내 정보
    useEffect(() => {
        if (!accessToken) {
            setMyInfo({ nickname: "로그인 필요", trust: 0, avatarUrl: "" });
            return;
        }

        (async () => {
            try {
                // ✅ 리라이트 경로 사용
                const res = await fetch("/api/sing/me", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    credentials: "include",
                    cache: "no-store",
                });

                if (res.ok) {
                    const data = await res.json();
                    setMyInfo({
                        nickname: data.uName || "사용자",
                        trust: data.uManner || 0,
                        avatarUrl: data.avatarUrl || "",
                    });
                } else {
                    setMyInfo({ nickname: "정보 없음", trust: 0, avatarUrl: "" });
                }
            } catch (err) {
                console.error("❌ /api/sing/me fetch error:", err);
                setMyInfo({ nickname: "에러 발생", trust: 0, avatarUrl: "" });
            }
        })();
    }, [accessToken]);

    // 2) 내 상품 목록
    useEffect(() => {
        if (!accessToken) {
            setItems([]);
            return;
        }

        // 탭 → status
        let statusParam = "";
        if (tab === "selling") statusParam = "0";
        else if (tab === "sold") statusParam = "1";

        const url =
            statusParam === ""
                ? "/api/products/mypage"
                : `/api/products/mypage?status=${statusParam}`;

        (async () => {
            try {
                console.log("➡️ GET", url);
                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    credentials: "include",
                });

                if (!res.ok) {
                    // 여기서 404가 나오면 백엔드가 "해당 아이디의 회원이 없습니다." 던진 거
                    const txt = await res.text();
                    console.warn("❌ mypage not ok:", res.status, txt);
                    setItems([]);
                    return;
                }

                const data = await res.json();
                console.log("✅ mypage data:", data);

                const mapped = data.map((p, idx) => ({
                    id: idx + 1,
                    title: p.pd_title,
                    price: p.pd_price,
                    status: p.pd_status === "0" ? "SELLING" : "SOLD",
                    createdAt: p.pd_create
                        ? `${p.pd_create}T00:00:00Z`
                        : "2025-01-01T00:00:00Z",
                    img: "/no-image.png",
                    ago: p.pd_create || "",
                }));
                setItems(mapped);
            } catch (e) {
                console.error("❌ mypage fetch error:", e);
                setItems([]);
            }
        })();
    }, [accessToken, tab]);

    // 3) 정렬
    const sortedItems = useMemo(() => {
        const copied = [...items];
        switch (sort) {
            case "low":
                return copied.sort((a, b) => a.price - b.price);
            case "high":
                return copied.sort((a, b) => b.price - a.price);
            case "latest":
            default:
                return copied.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
        }
    }, [items, sort]);

    const trustPercent = Math.min(100, Math.round((myInfo.trust / 100) * 100));
    const trustColor =
        myInfo.trust < 20 ? "#8B4513" : myInfo.trust < 50 ? "#A3E635" : "#10B981";

    return (
        <main className={styles.wrap}>
            {/* 사이드바 */}
            <aside className={styles.sidebar}>
                <nav className={styles.sideNav}>
                    <div className={styles.sideHeader}>마이페이지</div>
                    {SIDE_SECTIONS.map((section) => (
                        <div key={section.title} className={styles.sideSection}>
                            <div className={styles.sideTitle}>{section.title}</div>
                            <ul className={styles.sideList}>
                                {section.items.map((it) => {
                                    const active = pathname === it.href;
                                    return (
                                        <li key={it.href}>
                                            <Link
                                                href={it.href}
                                                className={`${styles.sideLink} ${active ? styles.active : ""}`}
                                            >
                                                {it.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* 오른쪽 본문 */}
            <section className={styles.content}>
                {/* 프로필 */}
                <header className={styles.header}>
                    <div className={styles.profile}>
                        <div className={styles.avatar} aria-hidden>
                            {myInfo.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={myInfo.avatarUrl} alt="" />
                            ) : (
                                <span className={styles.avatarFallback} />
                            )}
                        </div>

                        <div className={styles.profileMeta}>
                            <div className={styles.nicknameRow}>
                                <strong className={styles.nickname}>
                                    {myInfo.nickname}
                                </strong>
                                <Link
                                    href="/store/intro"
                                    className={styles.openStore}
                                    aria-label="가게 소개 작성하기"
                                    title="가게 소개 작성"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                                        <path
                                            d="M14 3l7 7-11 11H3v-7L14 3zM16.5 5.5l2 2"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                        />
                                    </svg>
                                </Link>
                            </div>

                            <div className={styles.trustRow}>
                                <span className={styles.trustLabel}>
                                    신선도 <b>{myInfo.trust}</b>
                                </span>
                                <div className={styles.trustBar}>
                                    <span
                                        className={styles.trustGauge}
                                        style={{
                                            width: `${trustPercent}%`,
                                            background: trustColor,
                                        }}
                                    />
                                </div>
                                <span className={styles.trustMax}>100</span>
                            </div>

                            <p className={styles.trustDesc}>
                                앱에서 가게 소개 작성하고 신뢰도를 높여 보세요.
                            </p>
                        </div>
                    </div>

                    <div className={styles.headerRight}>
                        <Link href="/mypage/connect-cafe" className={styles.bannerCard}>
                            <div className={styles.bannerIcon} aria-hidden />
                            <div className={styles.bannerText}>
                                <strong>내 상품 2배로 노출시키기</strong>
                                <span>카페에 상품 자동 등록하기</span>
                            </div>
                            <span className={styles.bannerArrow} aria-hidden>
                                ›
                            </span>
                        </Link>

                        <ul className={styles.metricRow}>
                            {METRICS.map((m) => (
                                <li key={m.key} className={styles.metricItem}>
                                    <span className={styles.metricLabel}>{m.label}</span>
                                    <strong className={styles.metricValue}>{m.value}</strong>
                                </li>
                            ))}
                        </ul>
                    </div>
                </header>

                {/* 내 상품 */}
                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h3 className={styles.panelTitle}>내 상품</h3>
                        <nav className={styles.tabs} aria-label="내 상품 필터">
                            {TABS.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
                                    onClick={() => setTab(t.key)}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className={styles.panelSub}>
                        <span className={styles.total}>총 {sortedItems.length}개</span>
                        <div className={styles.sorts}>
                            {SORTS.map((s) => (
                                <button
                                    key={s.key}
                                    type="button"
                                    className={`${styles.sort} ${sort === s.key ? styles.sortActive : ""}`}
                                    onClick={() => setSort(s.key)}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {sortedItems.length === 0 ? (
                        <div className={styles.empty}>
                            선택된 조건에 해당하는 상품이 없습니다.
                        </div>
                    ) : (
                        <ul className={styles.grid}>
                            {sortedItems.map((it) => (
                                <li key={it.id} className={styles.card}>
                                    <Link href={`/store/${it.id}`} className={styles.cardLink}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={it.img} alt={it.title} className={styles.cardImg} />
                                        <div className={styles.cardBody}>
                                            <strong className={styles.cardTitle}>{it.title}</strong>
                                            <span className={styles.cardPrice}>
                                                {it.price.toLocaleString()}원
                                            </span>
                                            <span className={styles.cardMeta}>{it.ago}</span>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </main>
    );
}
