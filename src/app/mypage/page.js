"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./mypage.module.css";

const SIDE_SECTIONS = [
    {
        title: "거래 정보",
        items: [
            { href: "/mypage/sell", label: "판매내역" },
            { href: "/mypage/buy", label: "구매내역" },
            { href: "/mypage/shipping", label: "택배" },
            { href: "/mypage/like", label: "찜한 상품" },
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

const TABS = [
    { key: "all", label: "전체" },
    { key: "selling", label: "판매중" },
    { key: "reserved", label: "예약중" },
    { key: "sold", label: "판매완료" },
];

const SORTS = [
    { key: "latest", label: "최신순" },
    { key: "low", label: "낮은가격순" },
    { key: "high", label: "높은가격순" },
];

export default function MyPage() {
    // 데모 상태
    const [tab, setTab] = useState("all");
    const [sort, setSort] = useState("latest");

    // 실제로는 사용자 정보/상품을 서버에서 가져오세요.
    const user = {
        nickname: "씩씩한하이에나",
        trust: 162, // 0~1000
        avatarUrl: "", // 비어있으면 기본 이미지
    };

    const items = useMemo(() => {
        // TODO: 탭/정렬에 맞는 리스트 반환
        return []; // 지금은 빈 상태로 예시
    }, [tab, sort]);

    const trustPercent = Math.min(100, Math.round((user.trust / 1000) * 100));

    return (
        <main className={styles.wrap}>
            {/* 좌측 사이드바 */}
            <aside className={styles.sidebar}>
                <h2 className={styles.sidebarTitle}>마이페이지</h2>

                {SIDE_SECTIONS.map((section) => (
                    <div key={section.title} className={styles.sideSection}>
                        <div className={styles.sideSectionTitle}>{section.title}</div>
                        <ul className={styles.sideList}>
                            {section.items.map((it) => (
                                <li key={it.href}>
                                    <Link href={it.href} className={styles.sideLink}>
                                        {it.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </aside>

            {/* 메인 콘텐츠 */}
            <section className={styles.content}>
                {/* 상단 프로필 & 신뢰지수 & 우측 배너/지표 */}
                <header className={styles.header}>
                    <div className={styles.profile}>
                        <div className={styles.avatar} aria-hidden>
                            {user.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={user.avatarUrl} alt="" />
                            ) : (
                                <span className={styles.avatarFallback} />
                            )}
                        </div>

                        <div className={styles.profileMeta}>
                            <div className={styles.nicknameRow}>
                                <strong className={styles.nickname}>{user.nickname}</strong>
                                <Link
                                    href="/store/intro"
                                    className={styles.openStore}
                                    aria-label="가게 소개 작성하기"
                                    title="가게 소개 작성"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                                        <path d="M14 3l7 7-11 11H3v-7L14 3zM16.5 5.5l2 2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                                    </svg>
                                </Link>
                            </div>

                            <div className={styles.trustRow}>
                <span className={styles.trustLabel}>
                  신뢰지수 <b>{user.trust}</b>
                </span>
                                <div className={styles.trustBar}>
                  <span
                      className={styles.trustGauge}
                      style={{ width: `${trustPercent}%` }}
                  />
                                </div>
                                <span className={styles.trustMax}>1,000</span>
                            </div>

                            <p className={styles.trustDesc}>
                                앱에서 가게 소개 작성하고 신뢰도를 높여 보세요.
                            </p>
                        </div>
                    </div>

                    <div className={styles.headerRight}>
                        <Link href="/payCharge" className={styles.bannerCard}>
                            <div className={styles.bannerIcon} aria-hidden />
                            <div className={styles.bannerText}>
                                <strong>대파 페이 충전하기</strong>
                            </div>
                            <span className={styles.bannerArrow} aria-hidden>›</span>
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

                {/* 내 상품 탭/정렬 */}
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
                        <span className={styles.total}>총 {items.length}개</span>
                        <div className={styles.sorts}>
                            {SORTS.map((s, i) => (
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

                    {/* 리스트/빈 상태 */}
                    {items.length === 0 ? (
                        <div className={styles.empty}>
                            선택된 조건에 해당하는 상품이 없습니다.
                        </div>
                    ) : (
                        <ul className={styles.grid}>
                            {items.map((it) => (
                                <li key={it.id} className={styles.card}>
                                    {/* 상품 카드 마크업 예시 */}
                                    <Link href={`/store/${it.id}`} className={styles.cardLink}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={it.img} alt={it.title} className={styles.cardImg} />
                                        <div className={styles.cardBody}>
                                            <strong className={styles.cardTitle}>{it.title}</strong>
                                            <span className={styles.cardPrice}>
                        {it.price.toLocaleString()}원
                      </span>
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
