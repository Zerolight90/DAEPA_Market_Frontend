"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, API_BASE, Endpoints } from "@/app/sell/api";
import tokenStore from "@/app/store/TokenStore";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import styles from "./all.module.css";

export default function AllProductsPage() {
    const searchParams = useSearchParams();
    const sort = searchParams.get("sort") || "recent";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // 토큰
    const accessToken = tokenStore((state) => state.accessToken);

    // 공통: 한 번 불러온 목록에 대해 찜 상태 끼워넣기
    const fillFavoriteStatus = async (list) => {
        // 비로그인일 땐 그냥 그대로
        if (!accessToken) return list;

        const headers = { Authorization: `Bearer ${accessToken}` };

        const updated = await Promise.all(
            list.map(async (item) => {
                try {
                    const res = await fetch(
                        `${API_BASE}${Endpoints.favoriteStatus(item.id)}`,
                        {
                            credentials: "include",
                            cache: "no-store",
                            headers,
                        }
                    );
                    if (!res.ok) return item;
                    const data = await res.json();
                    return {
                        ...item,
                        favorited: !!data.favorited,
                        favoriteCount: data.count ?? 0,
                    };
                } catch (e) {
                    return item;
                }
            })
        );

        return updated;
    };

    async function loadProducts(reset = false) {
        try {
            setLoading(true);
            const res = await apiFetch(
                `/api/products?sort=${sort}&page=${reset ? 0 : page}&size=20`
            );
            const list = Array.isArray(res?.content) ? res.content : [];

            // 기본 매핑
            let mapped = list.map((p) => ({
                id: p.pdIdx,
                title: p.pdTitle,
                price: p.pdPrice,
                thumb: p.pdThumb,
                createdAt: p.pdCreate,
                dsell: p.dsell ?? p.dSell ?? p.d_sell ?? null,
                dstatus: p.dstatus ?? p.dStatus ?? p.d_status ?? null,
                favorited: false,
                favoriteCount: 0,
            }));

            // 찜 상태 붙이기
            mapped = await fillFavoriteStatus(mapped);

            if (reset) {
                setProducts(mapped);
                setPage(1);
            } else {
                setProducts((prev) => [...prev, ...mapped]);
                setPage((prev) => prev + 1);
            }

            setHasMore(list.length >= 20);
        } catch (e) {
            console.error("[/all] 상품 불러오기 실패:", e);
        } finally {
            setLoading(false);
        }
    }

    // sort 바뀔 때마다 처음부터
    useEffect(() => {
        loadProducts(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sort]);

    const handleMore = () => {
        if (!loading && hasMore) loadProducts(false);
    };

    // 개별 카드에서 찜 토글
    const handleToggleFavorite = async (e, productId) => {
        e.preventDefault();
        e.stopPropagation();

        const url = `${API_BASE}${Endpoints.favoriteToggle(productId)}`;

        try {
            const headers = {
                "Content-Type": "application/json",
            };
            if (accessToken) {
                headers.Authorization = `Bearer ${accessToken}`;
            }

            const res = await fetch(url, {
                method: "POST",
                credentials: "include",
                headers,
            });

            if (res.status === 401) {
                alert("로그인이 필요합니다.");
                return;
            }

            if (!res.ok) {
                const msg = await res.text().catch(() => res.statusText);
                console.error("[favoriteToggle] HTTP", res.status, msg);
                alert(`찜 처리 실패 (${res.status})\n${msg}`);
                return;
            }

            const data = await res.json();

            setProducts((prev) =>
                prev.map((p) =>
                    p.id === productId
                        ? {
                            ...p,
                            favorited: !!data.favorited,
                            favoriteCount: data.count ?? 0,
                        }
                        : p
                )
            );
        } catch (err) {
            console.error("[favoriteToggle] fetch error:", err);
            alert(`찜 처리 중 오류가 발생했습니다.\n${String(err)}`);
        }
    };

    return (
        <div className={styles.page}>
            {/* 빵부스러기 비슷하게 */}
            <div className={styles.bcWrap}>
                <Link href="/" className={styles.bc}>
                    홈
                </Link>
                <span className={styles.sep}>/</span>
                <span className={styles.bc}>전체 상품</span>
            </div>

            <main className={styles.container}>
                {/* 왼쪽: 리스트 */}
                <div className={styles.leftCol}>
                    <div className={styles.section}>
                        <div className={styles.listHead}>
                            <h1 className={styles.title}>
                                {sort === "favorite" ? "찜이 많은 상품" : "전체 상품"}
                            </h1>
                            <div className={styles.sortTabs}>
                                <Link
                                    href="/all?sort=recent"
                                    className={
                                        sort === "recent" ? styles.activeSort : styles.sortTab
                                    }
                                >
                                    최신순
                                </Link>
                                <Link
                                    href="/all?sort=favorite"
                                    className={
                                        sort === "favorite" ? styles.activeSort : styles.sortTab
                                    }
                                >
                                    찜 많은 순
                                </Link>
                            </div>
                        </div>

                        <div className={styles.grid}>
                            {products.map((item) => {
                                const soldOut =
                                    Number(
                                        item.dsell ??
                                        item.dSell ??
                                        item.dstatus ??
                                        item.dStatus ??
                                        0
                                    ) === 1;

                                return (
                                    <Link
                                        key={item.id}
                                        href={`/store/${item.id}`}
                                        className={styles.card}
                                    >
                                        <div className={styles.thumbWrap}>
                                            <img
                                                src={item.thumb || "/no-image.png"}
                                                alt={item.title}
                                                className={styles.thumb}
                                                style={{
                                                    filter: soldOut ? "brightness(0.35)" : "none",
                                                }}
                                            />
                                            {soldOut && (
                                                <div className={styles.soldOverlay}>
                                                    <div className={styles.soldCircle}>✓</div>
                                                    <div>판매완료</div>
                                                </div>
                                            )}

                                            {/* 찜 버튼 */}
                                            <button
                                                className={styles.heartBtn}
                                                onClick={(e) =>
                                                    handleToggleFavorite(e, item.id)
                                                }
                                                aria-label="찜하기"
                                                title="찜하기"
                                            >
                                                {item.favorited ? (
                                                    <FavoriteIcon className={styles.heartOn} />
                                                ) : (
                                                    <FavoriteBorderIcon
                                                        className={styles.heartOff}
                                                    />
                                                )}
                                                <span className={styles.heartCnt}>
                                                    {item.favoriteCount}
                                                </span>
                                            </button>
                                        </div>
                                        <div className={styles.meta}>
                                            <div className={styles.prodTitle}>{item.title}</div>
                                            <div className={styles.price}>
                                                {item.price?.toLocaleString?.() ?? item.price}원
                                            </div>
                                            <div className={styles.date}>
                                                {item.createdAt ? item.createdAt.slice(0, 10) : ""}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}

                            {loading && (
                                <>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className={styles.skeleton}></div>
                                    ))}
                                </>
                            )}

                            {!loading && products.length === 0 && (
                                <p className={styles.empty}>상품이 없습니다.</p>
                            )}
                        </div>

                        {hasMore && !loading && (
                            <button onClick={handleMore} className={styles.moreBtn}>
                                더 보기
                            </button>
                        )}
                    </div>
                </div>

                {/* 오른쪽: 비워두거나 나중에 인기검색, 배너 넣을 자리 */}
                <div className={styles.rightCol}>
                    <div className={styles.infoCard}>
                        <h3>알림</h3>
                        <p>최근 3일 이내 판매완료된 상품은 목록에서 숨겨집니다.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
