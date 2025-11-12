// src/app/all/page.js (content 부분만 전체 교체해도 됨)
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, API_BASE, Endpoints } from "@/app/sell/api";
import tokenStore from "@/app/store/TokenStore";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import styles from "./all.module.css";
import { CircularProgress, Box, Typography } from "@mui/material";

function AllProductsContent() {
    const searchParams = useSearchParams();
    const sort = searchParams.get("sort") || "recent";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const accessToken = tokenStore((state) => state.accessToken);

    const fillFavoriteStatus = async (list) => {
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
                } catch {
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

            let mapped = list.map((p) => ({
                id: p.pdIdx,
                title: p.pdTitle,
                price: p.pdPrice,
                thumb: p.pdThumb,
                createdAt: p.pdCreate,
                dsell: p.dsell ?? p.dSell ?? p.d_sell ?? null,
                dstatus: p.dstatus ?? p.dStatus ?? p.d_status ?? null,
                pdDel: p.pdDel ?? p.pd_del ?? 0,
                favorited: false,
                favoriteCount: 0,
            }));

            // ✨ 여기서 삭제된 상품은 바로 버려도 됨
            mapped = mapped.filter((p) => Number(p.pdDel ?? 0) === 0);

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

    useEffect(() => {
        loadProducts(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sort]);

    const handleMore = () => {
        if (!loading && hasMore) loadProducts(false);
    };

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
            alert(`찜 처리 중 오류가 발생했습니다.\n${String(err)}`);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.bcWrap}>
                <Link href="/" className={styles.bc}>
                    홈
                </Link>
                <span className={styles.sep}>/</span>
                <span className={styles.bc}>전체 상품</span>
            </div>

            <main className={styles.container}>
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
                                const rawSell =
                                    item.dsell ??
                                    item.dSell ??
                                    item.dstatus ??
                                    item.dStatus ??
                                    0;
                                const sellState = Number(rawSell) || 0;
                                const isSold = sellState === 1;
                                const isTrading = sellState === 2;

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
                                                    filter: isSold || isTrading ? "brightness(0.35)" : "none",
                                                }}
                                            />
                                            {(isSold || isTrading) && (
                                                <div className={styles.soldOverlay}>
                                                    <div className={styles.soldCircle}>✓</div>
                                                    <div>{isSold ? "판매완료" : "판매 중"}</div>
                                                </div>
                                            )}

                                            <button
                                                className={styles.heartBtn}
                                                onClick={(e) => handleToggleFavorite(e, item.id)}
                                                aria-label="찜하기"
                                                title="찜하기"
                                            >
                                                {item.favorited ? (
                                                    <FavoriteIcon className={styles.heartOn} />
                                                ) : (
                                                    <FavoriteBorderIcon className={styles.heartOff} />
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

                            {loading &&
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className={styles.skeleton}></div>
                                ))}

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

export default function AllProductsPage() {
    return (
        <Suspense
            fallback={
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100vh",
                    }}
                >
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>페이지를 불러오는 중...</Typography>
                </Box>
            }
        >
            <AllProductsContent />
        </Suspense>
    );
}
