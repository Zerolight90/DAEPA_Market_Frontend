"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./mypage.module.css";
import SideNav from "@/components/mypage/sidebar";
import api from "@/lib/api"; // 전역 axios 인스턴스 사용

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

// S3 기본 이미지
const FALLBACK_IMG =
    "https://daepa-s3.s3.ap-northeast-2.amazonaws.com/products/KakaoTalk_20251104_145039505.jpg";

/** pd_del 여러 타입(숫자/문자/boolean) 다 잡아내기 */
function isDeleted(raw) {
    const val =
        raw?.pdDel ??
        raw?.pd_del ??
        (raw?.pd_del === 0 ? raw?.pd_del : raw?.pdDel);

    const s = String(val).trim().toLowerCase();
    return s === "1" || s === "true" || s === "y" || s === "yes";
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

export default function MyPage() {
    const pathname = usePathname();
    const [isHydrated, setIsHydrated] = useState(false);

    const [tab, setTab] = useState("all");
    const [sort, setSort] = useState("latest");

    const [myInfo, setMyInfo] = useState({
        nickname: "로딩 중...",
        trust: 0,
        avatarUrl: "",
        uIdx: undefined,
    });

    const [products, setProducts] = useState<any[]>([]);
    const [productErr, setProductErr] = useState("");
    const [safeCount, setSafeCount] = useState(0);
    const [myDaepa, setMyDaepa] = useState(0);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        // Zustand 스토어가 localStorage로부터 상태를 복원(rehydration)했는지 확인
        setIsHydrated(true);
    }, []);

    // ✅ 잔액, 내 정보, 상품 목록, 정산 내역을 한 번에 가져오는 로직
    useEffect(() => {
        if (!isHydrated) return; // 스토어가 준비될 때까지 대기

        const fetchAllMyPageData = async () => {
            try {
                setError(null);

                // 1. 내 정보 가져오기
                const meRes = await api.get("/sign/me");
                const meData = meRes.data;
                
                const profileUrl = meData.u_profile ?? meData.uProfile ?? meData.avatarUrl ?? "";
                const mannerScore = meData.uManner ?? meData.u_manner ?? meData.manner ?? meData.trust ?? 0;
                const uIdx = meData.uIdx ?? meData.u_idx ?? meData.id ?? undefined;

                setMyInfo({
                    nickname: meData.uName || meData.u_nickname || meData.uNickname || "사용자",
                    trust: Number(mannerScore) || 0,
                    avatarUrl: profileUrl,
                    uIdx: uIdx,
                });

                // 2. 상품 목록 가져오기
                const productsRes = await api.get("/products/mypage");
                const productsData = productsRes.data;
                setProducts(Array.isArray(productsData) ? productsData : []);

                // 3. 잔액 조회
                const balanceRes = await api.get("/pay/balance");
                setMyDaepa(balanceRes.data.balance);

                // 4. 정산 내역 개수 (uIdx가 있어야 호출 가능)
                if (uIdx) {
                    const safeCountRes = await api.get(`/deal/safe/count?uIdx=${uIdx}`);
                    const safeCountData = safeCountRes.data;
                    setSafeCount(typeof safeCountData === "number" ? safeCountData : safeCountData?.count ?? 0);
                }

            } catch (err) {
                console.error("마이페이지 데이터 조회 실패:", err);
                setError(err.response?.data?.message || err.message);
                setMyInfo({
                    nickname: "로그인 필요",
                    trust: 0,
                    avatarUrl: "",
                    uIdx: undefined,
                });
                setProducts([]);
                if (err.response?.status === 401) {
                    // 로그인 페이지로 리다이렉트 또는 로그인 모달 표시
                }
            }
        };

        fetchAllMyPageData();
    }, [isHydrated]);

    // ✅ 내 상품만
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

    // 판매중(= dealState 2 또는 0)
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

    // ✅ 신선도 바 계산
    const trustVal = Number(myInfo.trust) || 0;
    const trustPercent = Math.max(0, Math.min(100, trustVal));
    const trustColor =
        trustPercent < 30 ? "#8B4513" : trustPercent < 60 ? "#A3E635" : "#10B981";

    // ✅ 상단 메트릭(정산내역/후기/대파) — 렌더 시점 계산
    const metrics = useMemo(
        () => [
            { key: "safe", label: "정산내역", value: `${safeCount.toLocaleString()} 건` },
            { key: "review", label: "거래후기", value: 0 },
            { key: "eco", label: "대파 갯수", value: `${myDaepa.toLocaleString()} 개` },
        ],
        [safeCount, myDaepa]
    );

    if (!isHydrated) {
        return <main className={styles.wrap}><div className={styles.loading}>페이지를 불러오는 중입니다...</div></main>;
    }

    if (error) {
        return (
            <main className={styles.wrap}>
                <div className={styles.empty}>
                    {error} <Link href="/sign/login">로그인 페이지로 이동</Link>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.wrap}>
            <SideNav currentPath={pathname} />
            <section className={styles.content}>
                <header className={styles.header}>
                    <div className={styles.profile}>
                        <div className={styles.avatar} aria-hidden>
                            <img src={myInfo.avatarUrl || FALLBACK_IMG} alt={myInfo.avatarUrl ? "프로필 이미지" : "기본 프로필"} />
                        </div>
                        <div className={styles.profileMeta}>
                            <div className={styles.nicknameRow}>
                                <strong className={styles.nickname}>{myInfo.nickname}</strong>
                                <Link href="/mypage/info" className={styles.openStore} aria-label="가게 소개 작성하기" title="가게 소개 작성">
                                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                                        <path d="M14 3l7 7-11 11H3v-7L14 3zM16.5 5.5l2 2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                                    </svg>
                                </Link>
                            </div>
                            <div className={styles.trustRow}>
                                <span className={styles.trustLabel}>신선도 <b>{trustVal}</b></span>
                                <div className={styles.trustBar}>
                                    <span className={styles.trustGauge} style={{ width: `${trustPercent}%`, backgroundColor: trustColor }} />
                                </div>
                                <span className={styles.trustMax}>100</span>
                            </div>
                            <p className={styles.trustDesc}>앱에서 가게 소개 작성하고 신뢰도를 높여 보세요.</p>
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        <Link href="/payCharge" className={styles.bannerCard}>
                            <div className={styles.bannerIcon} aria-hidden>💰</div>
                            <div className={styles.bannerText}><strong>대파 페이 충전하기</strong></div>
                            <span className={styles.bannerArrow} aria-hidden>›</span>
                        </Link>
                        <ul className={styles.metricRow}>
                            {metrics.map((m) => (
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
                                <button key={t.key} type="button" className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`} onClick={() => setTab(t.key)}>
                                    {t.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className={styles.panelSub}>
                        <span className={styles.total}>총 {sortedItems.length}개</span>
                        <div className={styles.sorts}>
                            {SORTS.map((s) => (
                                <button key={s.key} type="button" className={`${styles.sort} ${sort === s.key ? styles.sortActive : ""}`} onClick={() => setSort(s.key)}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {productErr && <div className={styles.empty}>{productErr}</div>}

                    {sortedItems.length === 0 && !productErr ? (
                        <div className={styles.empty}>선택된 조건에 해당하는 항목이 없습니다.</div>
                    ) : (
                        <ul className={styles.grid}>
                            {sortedItems.map((it, idx) => {
                                const dealState = getDealState(it);
                                const isSold = dealState === 1;
                                const isTrading = dealState === 2;
                                const title = it.pd_title || it.title || "(제목 없음)";
                                const price = it.pd_price ?? it.price ?? 0;
                                const when = formatDateRelative(it.pd_create ?? it.createdAt);
                                const thumb = it.pd_thumb || it.thumbnail || FALLBACK_IMG;
                                const id = it.pd_idx ?? it.pdIdx ?? it.id ?? null;
                                const href = id ? `/store/${id}` : "#";

                                return (
                                    <li key={id ?? idx} className={styles.card}>
                                        <Link href={href} className={styles.cardLink}>
                                            <div className={styles.cardImgWrap}>
                                                <img src={thumb} alt={title} className={styles.cardImg} style={{ filter: isSold || isTrading ? "brightness(0.45)" : "none" }} />
                                                {(isSold || isTrading) && (
                                                    <div className={styles.cardOverlay}>
                                                        <div className={styles.cardOverlayCircle}>✓</div>
                                                        <div>{isSold ? "판매완료" : "판매 중"}</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.cardBody}>
                                                <strong className={styles.cardTitle}>{title}</strong>
                                                <span className={styles.cardPrice}>{Number(price).toLocaleString()}원</span>
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