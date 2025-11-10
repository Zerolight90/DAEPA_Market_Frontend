'use client';

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./mypage.module.css";
import tokenStore from "@/app/store/TokenStore";
import SideNav from "@/components/mypage/sidebar";

const METRICS = [
    { key: "safe", label: "안심결제", value: 0 },
    { key: "review", label: "거래후기", value: 0 },
    { key: "close", label: "단골", value: 0 },
    { key: "eco", label: "에코마일", value: "0 M" },
];

const TABS = [
    { key: "all", label: "전체" },
    { key: "selling", label: "판매중" },
    { key: "sold", label: "판매완료" },
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
        uIdx: undefined,
    });

    // ✅ product 용
    const [products, setProducts] = useState([]);
    const [productErr, setProductErr] = useState("");

    // ----------------------------------------------------
    // 내 정보
    // ----------------------------------------------------
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
                    setMyInfo({
                        nickname: data.uName || data.u_nickname || data.uNickname || "사용자",
                        trust: data.uManner ?? 0,
                        avatarUrl: data.avatarUrl || "",
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
            } catch (error) {
                console.error("❌ /api/sing/me fetch error:", error);
                setMyInfo({
                    nickname: "에러 발생",
                    trust: 0,
                    avatarUrl: "",
                    uIdx: undefined,
                });
            }
        })();
    }, [accessToken]);

    // ----------------------------------------------------
    // product 목록 (전체 / 판매중 / 판매완료 전부 여기서 필터)
    // ----------------------------------------------------
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
                    console.warn("❌ /api/products/mypage not ok:", res.status, txt);
                    setProductErr(txt || "상품 목록을 불러오지 못했습니다.");
                    setProducts([]);
                    return;
                }

                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("❌ /api/products/mypage fetch error:", err);
                setProductErr("네트워크 오류가 발생했습니다.");
                setProducts([]);
            }
        })();
    }, [accessToken]);

    // ✅ 상대시간 포맷터
    function formatDateRelative(dateStr) {
        if (!dateStr) return "";
        const date = new Date(String(dateStr).replace(" ", "T"));
        if (Number.isNaN(date.getTime())) return String(dateStr);

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return "방금 전";
        if (diffMin < 60) return `${diffMin}분 전`;
        if (diffHour < 24) return `${diffHour}시간 전`;
        if (diffDay < 30) return `${diffDay}일 전`;

        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}.${m}.${d}`;
    }

    // product에서 d_sell 여러 형태 대응
    function getProductDSell(p) {
        return (
            p.d_sell ??
            p.dSell ??
            p.dsell ??
            p.pd_sell ??
            0
        );
    }

    // product에서 d_status 여러 형태 대응 (판매완료용)
    function getProductDStatus(p) {
        return (
            p.d_status ??
            p.dStatus ??
            p.dstatus ??
            p.pd_status ??
            0
        );
    }

    // ----------------------------------------------------
    // 1) 전체 탭: 내 product 전부 (u_idx == me)
    // ----------------------------------------------------
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
            return Number(owner) === Number(myId);
        });
    }, [products, myInfo.uIdx]);

    // ----------------------------------------------------
    // 2) 판매중 탭: 내 product 중 d_sell == 0
    // ----------------------------------------------------
    const myProductsSelling = useMemo(() => {
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

            const dsell = getProductDSell(p);
            return Number(dsell) === 0;
        });
    }, [products, myInfo.uIdx]);

    // ----------------------------------------------------
    // 3) 판매완료 탭: 내 product 중 d_status == 1
    // ----------------------------------------------------
    const myProductsSold = useMemo(() => {
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

            const dStatus = getProductDStatus(p);
            return Number(dStatus) === 1;
        });
    }, [products, myInfo.uIdx]);

    // ----------------------------------------------------
    // 탭 + 정렬 적용
    // ----------------------------------------------------
    const sortedItems = useMemo(() => {
        // 전체
        if (tab === "all") {
            const copied = [...myProductsAll];
            if (sort === "low") {
                return copied.sort((a, b) => (a.pd_price ?? 0) - (b.pd_price ?? 0));
            }
            if (sort === "high") {
                return copied.sort((a, b) => (b.pd_price ?? 0) - (a.pd_price ?? 0));
            }
            return copied.sort((a, b) => {
                const da = a.pd_create ?? a.createdAt ?? "";
                const db = b.pd_create ?? b.createdAt ?? "";
                return new Date(db).getTime() - new Date(da).getTime();
            });
        }

        // 판매중
        if (tab === "selling") {
            const copied = [...myProductsSelling];
            if (sort === "low") {
                return copied.sort((a, b) => (a.pd_price ?? 0) - (b.pd_price ?? 0));
            }
            if (sort === "high") {
                return copied.sort((a, b) => (b.pd_price ?? 0) - (a.pd_price ?? 0));
            }
            return copied.sort((a, b) => {
                const da = a.pd_create ?? a.createdAt ?? "";
                const db = b.pd_create ?? b.createdAt ?? "";
                return new Date(db).getTime() - new Date(da).getTime();
            });
        }

        // 판매완료 → myProductsSold (d_status == 1)
        const copied = [...myProductsSold];
        if (sort === "low") {
            return copied.sort((a, b) => (a.pd_price ?? 0) - (b.pd_price ?? 0));
        }
        if (sort === "high") {
            return copied.sort((a, b) => (b.pd_price ?? 0) - (a.pd_price ?? 0));
        }
        return copied.sort((a, b) => {
            const da = a.pd_create ?? a.createdAt ?? "";
            const db = b.pd_create ?? b.createdAt ?? "";
            return new Date(db).getTime() - new Date(da).getTime();
        });
    }, [
        tab,
        sort,
        myProductsAll,
        myProductsSelling,
        myProductsSold,
    ]);

    const trustPercent = Math.min(100, Math.round((myInfo.trust / 100) * 100));
    const trustColor =
        myInfo.trust < 20 ? "#8B4513" : myInfo.trust < 50 ? "#A3E635" : "#10B981";

    return (
        <main className={styles.wrap}>
            <SideNav currentPath={pathname} />

            <section className={styles.content}>
                {/* 프로필 영역 */}
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
                  신선도 <b>{myInfo.trust}</b>
                </span>
                                <div className={styles.trustBar}>
                  <span
                      className={styles.trustGauge}
                      style={{ width: `${trustPercent}%`, background: trustColor }}
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
                            <div className={styles.bannerText}><strong>대파 페이 충전하기</strong></div>
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

                {/* 패널 */}
                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h3 className={styles.panelTitle}>내 상품</h3>
                        <nav className={styles.tabs} aria-label="내 판매 필터">
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

                    {/* 에러 표시 */}
                    {productErr && (
                        <div className={styles.empty}>{productErr}</div>
                    )}

                    {sortedItems.length === 0 ? (
                        <div className={styles.empty}>선택된 조건에 해당하는 항목이 없습니다.</div>
                    ) : (
                        <ul className={styles.grid}>
                            {sortedItems.map((it, idx) => {
                                // 전체 / 판매중 / 판매완료 전부 product 기반으로 보여줌
                                const title = it.pd_title || "(제목 없음)";
                                const price = it.pd_price ?? 0;
                                const when = formatDateRelative(it.pd_create);

                                return (
                                    <li key={it.pd_idx ?? it.id ?? idx} className={styles.card}>
                                        <div className={styles.cardLink}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={"/no-image.png"}
                                                alt={title}
                                                className={styles.cardImg}
                                            />
                                            <div className={styles.cardBody}>
                                                <strong className={styles.cardTitle}>{title}</strong>
                                                <span className={styles.cardPrice}>
                          {price.toLocaleString()}원
                        </span>
                                                <span className={styles.cardMeta}>{when}</span>
                                            </div>
                                        </div>
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
