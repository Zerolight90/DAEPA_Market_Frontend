"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./mypage.module.css";
import tokenStore from "@/app/store/TokenStore";
import SideNav from "@/components/mypage/sidebar";

const METRICS = [
    { key: "safe", label: "안심결제", value: 0 },
    { key: "review", label: "거래후기", value: 0 },
    { key: "eco", label: "대파 갯수", value: " 개" },
];

const TABS = [
    { key: "all", label: "전체" },
    { key: "selling", label: "거래중" },
    { key: "sold", label: "거래완료" },
];

const SORTS = [
    { key: "latest", label: "최신순" },
    { key: "low", label: "낮은가격순" },
    { key: "high", label: "높은가격순" },
];

const FALLBACK_IMG =
    "https://daepa-s3.s3.ap-northeast-2.amazonaws.com/products/KakaoTalk_20251104_145039505.jpg";

/** pd_del 여러 타입(숫자/문자/boolean) 다 잡아내기 */
function isDeleted(raw) {
    const val =
        raw?.pdDel ??
        raw?.pd_del ??
        raw?.pd_del === 0
            ? raw?.pd_del
            : raw?.pdDel;

    const s = String(val).trim().toLowerCase();
    return (
        s === "1" ||
        s === "true" ||
        s === "y" ||
        s === "yes"
    );
}

/** ProductCard.js 와 같은 판매상태 파싱 */
function getDealState(raw) {
    const rawSell =
        raw?.dSell ??
        raw?.d_sell ??
        raw?.dsell ??
        raw?.dStatus ??
        raw?.d_status ??
        raw?.dstatus ??
        raw?.dealStatus ??
        0;
    return Number(rawSell) || 0; // 0: 없음, 1: 판매완료, 2: 판매중
}

function parseDateSafe(raw) {
    if (!raw) return 0;
    let s = String(raw).trim().replace(" ", "T");
    const t = new Date(s).getTime();
    return Number.isNaN(t) ? 0 : t;
}

function formatDateRelative(raw) {
    if (!raw) return "";
    let s = String(raw).trim().replace(" ", "T");
    const date = new Date(s);
    if (Number.isNaN(date.getTime())) return raw;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const d = diffMs / 1000;
    const min = Math.floor(d / 60);
    const hour = Math.floor(min / 60);
    const day = Math.floor(hour / 24);

    if (d < 60) return "방금 전";
    if (min < 60) return `${min}분 전`;
    if (hour < 24) return `${hour}시간 전`;
    if (day < 30) return `${day}일 전`;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${y}.${m}.${dd}`;
}

export default function MyPage() {
    const pathname = usePathname();
    const { accessToken } = tokenStore();

    const [tab, setTab] = useState("all");
    const [sort, setSort] = useState("latest");

    const [myInfo, setMyInfo] = useState({
        nickname: "로딩 중...",
        trust: 0,
        avatarUrl: "",
        uIdx: undefined,
    });

    const [products, setProducts] = useState([]);
    const [productErr, setProductErr] = useState("");

    // 내 정보
    useEffect(() => {
        if (!accessToken) {
            setMyInfo({
                nickname: "로그인 필요",
                trust: 0,
                avatarUrl: "",
                uIdx: undefined,
            });
            return;
        }

        (async () => {
            try {
                const res = await fetch("/api/sing/me", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${accessToken}` },
                    credentials: "include",
                    cache: "no-store",
                });

                if (res.ok) {
                    const data = await res.json();
                    const profileUrl =
                        data.uProfile ||
                        data.u_profile ||
                        data.avatarUrl ||
                        "";
                    const mannerScore =
                        data.uManner ??
                        data.u_manner ??
                        data.manner ??
                        data.trust ??
                        0;

                    setMyInfo({
                        nickname:
                            data.uName ||
                            data.u_nickname ||
                            data.uNickname ||
                            "사용자",
                        trust: Number(mannerScore) || 0,
                        avatarUrl: profileUrl,
                        uIdx: data.uIdx ?? data.u_idx ?? data.id ?? undefined,
                    });
                } else {
                    setMyInfo({
                        nickname: "정보 없음",
                        trust: 0,
                        avatarUrl: "",
                        uIdx: undefined,
                    });
                }
            } catch (e) {
                console.error(e);
                setMyInfo({
                    nickname: "에러 발생",
                    trust: 0,
                    avatarUrl: "",
                    uIdx: undefined,
                });
            }
        })();
    }, [accessToken]);

    // 내 상품
    useEffect(() => {
        if (!accessToken) {
            setProducts([]);
            return;
        }

        (async () => {
            try {
                setProductErr("");
                const res = await fetch("/api/products/mypage", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${accessToken}` },
                    credentials: "include",
                    cache: "no-store",
                });

                if (!res.ok) {
                    const txt = await res.text();
                    setProductErr(txt || "상품 목록을 불러오지 못했습니다.");
                    setProducts([]);
                    return;
                }

                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
                setProductErr("네트워크 오류가 발생했습니다.");
                setProducts([]);
            }
        })();
    }, [accessToken]);

    // 내 것만 + 삭제 안 된 것만
    const myProductsAll = useMemo(() => {
        const myId = myInfo.uIdx;
        if (!myId) return [];

        return products.filter((p) => {
            const owner =
                p.uIdx ??
                p.u_idx ??
                p.userIdx ??
                p.user_idx ??
                null;
            if (owner == null) return false;
            if (Number(owner) !== Number(myId)) return false;

            if (isDeleted(p)) return false;

            return true;
        });
    }, [products, myInfo.uIdx]);

    // 판매중(= dealState 2 또는 0) : 우리의 카드 로직은 2를 “판매 중”으로 보여주니까 우선 2, 그다음 0
    const myProductsSelling = useMemo(() => {
        return myProductsAll.filter((p) => {
            const state = getDealState(p);
            return state === 0 || state === 2;
        });
    }, [myProductsAll]);

    // 판매완료 (=1)
    const myProductsSold = useMemo(() => {
        return myProductsAll.filter((p) => getDealState(p) === 1);
    }, [myProductsAll]);

    // 정렬
    const sortedItems = useMemo(() => {
        let base = [];
        if (tab === "all") base = [...myProductsAll];
        else if (tab === "selling") base = [...myProductsSelling];
        else base = [...myProductsSold];

        if (sort === "low") {
            return base.sort((a, b) => (a.pd_price ?? 0) - (b.pd_price ?? 0));
        }
        if (sort === "high") {
            return base.sort((a, b) => (b.pd_price ?? 0) - (a.pd_price ?? 0));
        }

        return base.sort((a, b) => {
            const ta = parseDateSafe(a.pd_create ?? a.createdAt);
            const tb = parseDateSafe(b.pd_create ?? b.createdAt);
            return tb - ta;
        });
    }, [tab, sort, myProductsAll, myProductsSelling, myProductsSold]);

    const trustVal = Number(myInfo.trust) || 0;
    const trustPercent = Math.max(0, Math.min(100, trustVal));
    const trustColor =
        trustPercent < 30
            ? "#8B4513"
            : trustPercent < 60
                ? "#A3E635"
                : "#10B981";

    return (
        <main className={styles.wrap}>
            <SideNav currentPath={pathname} />

            <section className={styles.content}>
                <header className={styles.header}>
                    <div className={styles.profile}>
                        <div className={styles.avatar} aria-hidden>
                            {myInfo.avatarUrl ? (
                                <img
                                    src={myInfo.avatarUrl || FALLBACK_IMG}
                                    alt="프로필 이미지"
                                />
                            ) : (
                                <img src={FALLBACK_IMG} alt="기본 프로필" />
                            )}
                        </div>

                        <div className={styles.profileMeta}>
                            <div className={styles.nicknameRow}>
                                <strong className={styles.nickname}>{myInfo.nickname}</strong>
                                <Link
                                    href="/mypage/info"
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
                  신선도 <b>{trustVal}</b>
                </span>
                                <div className={styles.trustBar}>
                  <span
                      className={styles.trustGauge}
                      style={{
                          width: `${trustPercent}%`,
                          backgroundColor: trustColor,
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
                        <Link href="/payCharge" className={styles.bannerCard}>
                            <div className={styles.bannerIcon} aria-hidden />
                            <div className={styles.bannerText}>
                                <strong>대파 페이 충전하기</strong>
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

                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h3 className={styles.panelTitle}>내 상품</h3>
                        <nav className={styles.tabs} aria-label="내 판매 필터">
                            {TABS.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    className={`${styles.tab} ${
                                        tab === t.key ? styles.tabActive : ""
                                    }`}
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
                                    className={`${styles.sort} ${
                                        sort === s.key ? styles.sortActive : ""
                                    }`}
                                    onClick={() => setSort(s.key)}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {productErr && <div className={styles.empty}>{productErr}</div>}

                    {sortedItems.length === 0 ? (
                        <div className={styles.empty}>
                            선택된 조건에 해당하는 항목이 없습니다.
                        </div>
                    ) : (
                        <ul className={styles.grid}>
                            {sortedItems.map((it, idx) => {
                                if (isDeleted(it)) return null;

                                const dealState = getDealState(it);
                                const isSold = dealState === 1;
                                const isTrading = dealState === 2;

                                const title = it.pd_title || it.title || "(제목 없음)";
                                const price = it.pd_price ?? it.price ?? 0;
                                const when = formatDateRelative(it.pd_create ?? it.createdAt);
                                const thumb =
                                    it.pd_thumb || it.thumbnail || FALLBACK_IMG;

                                const id = it.pd_idx ?? it.pdIdx ?? it.id ?? null;
                                const href = id ? `/store/${id}` : "#";

                                return (
                                    <li key={id ?? idx} className={styles.card}>
                                        <Link href={href} className={styles.cardLink}>
                                            <div className={styles.cardImgWrap}>
                                                <img
                                                    src={thumb}
                                                    alt={title}
                                                    className={styles.cardImg}
                                                    style={{
                                                        filter:
                                                            isSold || isTrading ? "brightness(0.45)" : "none",
                                                    }}
                                                />
                                                {(isSold || isTrading) && (
                                                    <div className={styles.cardOverlay}>
                                                        <div className={styles.cardOverlayCircle}>✓</div>
                                                        <div>
                                                            {isSold ? "판매완료" : "판매 중"}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.cardBody}>
                                                <strong className={styles.cardTitle}>{title}</strong>
                                                <span className={styles.cardPrice}>
                          {Number(price).toLocaleString()}원
                        </span>
                                                <span className={styles.cardMeta}>{when}</span>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </section>
        </main>
    );
}
