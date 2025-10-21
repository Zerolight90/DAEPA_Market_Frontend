"use client";

import Link from "next/link";
import styles from "./help.module.css";
import { useState } from "react";

const CATEGORIES = [
    { key: "account", title: "계정/로그인", desc: "가입, 로그인, 비밀번호" },
    { key: "trade", title: "거래/결제", desc: "구매, 판매, 환불, 정산" },
    { key: "safety", title: "안전거래", desc: "사기예방, 신고, 보호정책" },
    { key: "policy", title: "정책/약관", desc: "운영정책, 약관, 개인정보" },
    { key: "shipping", title: "배송/픽업", desc: "택배, 예약, 수거" },
    { key: "etc", title: "기타", desc: "자주 묻는 질문 외" },
];

const HOT_ARTICLES = [
    { title: "비밀번호를 잊어버렸어요", slug: "forgot-password" },
    { title: "거래 중 분쟁이 발생했어요", slug: "trade-dispute" },
    { title: "사기 의심 계정을 신고하려면?", slug: "report-scam" },
    { title: "카카오/네이버 간편로그인 연동", slug: "social-login" },
    { title: "판매대금 정산 일정 안내", slug: "payout-schedule" },
    { title: "안전결제 수수료는 얼마인가요?", slug: "safe-pay-fee" },
];

const NOTICES = [
    { title: "추석 연휴 고객센터 운영 안내", slug: "holiday-hours", badge: "공지" },
    { title: "개인정보 처리방침 개정(2025-10-01)", slug: "privacy-update", badge: "업데이트" },
];

export default function HelpHome() {
    const [q, setQ] = useState("");

    const onSearch = (e) => {
        e.preventDefault();
        // 실제 검색 라우팅에 맞게 변경하세요.
        window.location.href = `/help/search?q=${encodeURIComponent(q)}`;
    };

    return (
        <main className={styles.wrap}>
            {/* Hero/Search */}
            <section className={styles.hero}>
                <h1 className={styles.title}>대파 마켓 고객센터</h1>
                <p className={styles.subtitle}>무엇을 도와드릴까요?</p>
                <form className={styles.search} onSubmit={onSearch} role="search">
                    <input
                        className={styles.searchInput}
                        placeholder="키워드를 입력하세요 (예: 비밀번호 변경, 환불)"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        aria-label="도움말 검색"
                    />
                    <button className={styles.searchBtn} type="submit">검색</button>
                </form>
            </section>

            {/* Notices */}
            {NOTICES.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.h2}>공지사항</h2>
                    <ul className={styles.noticeList}>
                        {NOTICES.map((n) => (
                            <li key={n.slug} className={styles.noticeItem}>
                                {n.badge && <span className={styles.badge}>{n.badge}</span>}
                                <Link href={`/help/notice/${n.slug}`} className={styles.link}>
                                    {n.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Categories Grid */}
            <section className={styles.section}>
                <h2 className={styles.h2}>도움말 카테고리</h2>
                <div className={styles.grid}>
                    {CATEGORIES.map((c) => (
                        <Link href={`/help/category/${c.key}`} key={c.key} className={styles.card}>
                            <div className={styles.cardIcon} aria-hidden />
                            <div className={styles.cardBody}>
                                <strong className={styles.cardTitle}>{c.title}</strong>
                                <span className={styles.cardDesc}>{c.desc}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Popular Articles */}
            <section className={styles.section}>
                <h2 className={styles.h2}>자주 찾는 도움말</h2>
                <ul className={styles.articleList}>
                    {HOT_ARTICLES.map((a) => (
                        <li key={a.slug} className={styles.articleItem}>
                            <Link href={`/help/article/${a.slug}`} className={styles.link}>
                                {a.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Contact / 1:1 문의 */}
            <section className={styles.section}>
                <h2 className={styles.h2}>추가 도움이 필요하신가요?</h2>
                <div className={styles.contactCard}>
                    <div className={styles.contactText}>
                        <strong>1:1 문의</strong>
                        <p>계정·거래 관련 상세 상담이 필요하면 문의를 남겨주세요.</p>
                        <ul className={styles.bullets}>
                            <li>운영시간: 평일 09:00 ~ 18:00 (점심 12:00 ~ 13:00)</li>
                            <li>문의 순서대로 답변드려요</li>
                        </ul>
                    </div>
                    <div className={styles.contactActions}>
                        <Link href="/help/contact" className={styles.primaryBtn}>문의하기</Link>
                        <Link href="/help/status" className={styles.secondaryBtn}>내 문의 내역</Link>
                    </div>
                </div>
            </section>

            {/* Footer Links */}
            <nav className={styles.footerNav} aria-label="고객센터 하단 링크">
                <Link href="/help/policy/terms">이용약관</Link>
                <span aria-hidden>·</span>
                <Link href="/help/policy/privacy">개인정보 처리방침</Link>
                <span aria-hidden>·</span>
                <Link href="/help/policy/safety">안전거래 가이드</Link>
            </nav>
        </main>
    );
}
