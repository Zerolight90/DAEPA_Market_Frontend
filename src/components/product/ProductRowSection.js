// src/components/product/ProductRowSection.js
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import styles from "./ProductRowSection.module.css";
import { api, Endpoints } from "@/app/sell/api";
import tokenStore from "@/store/TokenStore";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { formatTimeAgo } from "@/lib/formatters";

export default function ProductRowSection({
                                              title,
                                              sort = "recent",
                                              link = "/category/전체",
                                              query = {},
                                          }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 6;
    const accessToken = tokenStore((state) => state.accessToken);

    const buildQueryString = () => {
        const params = new URLSearchParams();
        params.set("sort", sort);
        params.set("size", query.size ? String(query.size) : "30");
        if (query.upperId) params.set("upperId", query.upperId);
        if (query.middleId) params.set("mid", query.middleId);
        if (query.lowId) params.set("low", query.lowId);
        params.set("page", "0");
        return params.toString();
    };

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const qs = buildQueryString();
                const { data: res } = await api.get(`/products?${qs}`);
                const list = Array.isArray(res?.content) ? res.content : [];

                const mapped = list
                    // ✨ 삭제된 거 제외
                    .filter((p) => Number(p.pdDel ?? p.pd_del ?? 0) === 0)
                    .map((p) => ({
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

                setItems(mapped);
                setPage(0);
            } catch (err) {
                console.error(`[ProductRowSection] ${title} 불러오기 실패`, err);
            } finally {
                setLoading(false);
            }
        })();
    }, [sort, JSON.stringify(query)]);

    useEffect(() => {
        if (!items.length) return;
        if (!accessToken) return;

        (async () => {
            try {
                const updated = await Promise.all(
                    items.map(async (item) => {
                        try {
                            const res = await api.get(Endpoints.favoriteStatus(item.id)); // axios 사용
                            const data = res.data; // axios는 응답 데이터를 res.data에 담습니다.
                            return {
                                ...item,
                                favorited: !!data.favorited,
                                favoriteCount: data.count ?? 0,
                            };
                        } catch (e) {
                            // 에러 발생 시 (예: 401) 해당 아이템은 변경 없이 반환
                            return item;
                        }
                    })
                );

                setItems(updated);
            } catch (e) {
                console.error("ProductRowSection 찜 상태 조회 실패:", e);
            }
        })();
    }, [items.length, accessToken]);

    const pages = useMemo(() => {
        if (!items.length) return [];
        const arr = [];
        for (let i = 0; i < items.length; i += PAGE_SIZE) {
            arr.push(items.slice(i, i + PAGE_SIZE));
        }
        return arr;
    }, [items]);

    const totalPages = pages.length || 1;

    const goPrev = () => setPage((p) => Math.max(0, p - 1));
    const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

    const onToggle = async (e, productId) => {
        e.preventDefault();
        e.stopPropagation();

        const url = Endpoints.favoriteToggle(productId);

        try {
            const res = await api.post(url); // axios 사용, 헤더는 인터셉터가 처리

            const data = res.data; // axios는 응답 데이터를 res.data에 담습니다.

            setItems((prev) =>
                prev.map((it) =>
                    it.id === productId
                        ? {
                            ...it,
                            favorited: !!data.favorited,
                            favoriteCount: data.count ?? 0,
                        }
                        : it
                )
            );
        } catch (err) {
            if (err.response?.status === 401) { // axios 에러 처리
                alert("로그인이 필요합니다.");
                return;
            }
            alert(`찜 처리 중 오류가 발생했습니다.\n${err.response?.data?.message || err.message}`);
        }
    };

    return (
        <section className={styles.section}>
            <div className={styles.head}>
                <h2 className={styles.title}>{title}</h2>
                <Link href={link} className={styles.more}>
                    전체보기 →
                </Link>
            </div>

            <div className={styles.viewport}>
                {page > 0 && (
                    <button
                        className={`${styles.navBtn} ${styles.left}`}
                        onClick={goPrev}
                    >
                        ‹
                    </button>
                )}

                <div
                    className={styles.track}
                    style={{ transform: `translateX(-${page * 100}%)` }}
                >
                    {loading && (
                        <div className={styles.page}>
                            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                                <div key={i} className={styles.skeleton} />
                            ))}
                        </div>
                    )}

                    {!loading &&
                        pages.map((pageItems, idx) => (
                            <div key={idx} className={styles.page}>
                                {pageItems.map((item) => {
                                    const rawSell =
                                        item.dsell ??
                                        item.dSell ??
                                        item.d_status ??
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
                                            className={styles.prodCard}
                                        >
                                            <div className={styles.thumbWrap}>
                                                <img
                                                    src={item.thumb || "/images/no-image.png"}
                                                    alt={item.title}
                                                    className={styles.thumb}
                                                    style={{
                                                        filter:
                                                            isSold || isTrading ? "brightness(0.35)" : "none",
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
                                                    onClick={(e) => onToggle(e, item.id)}
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
                                                <div className={styles.name}>{item.title}</div>
                                                <div className={styles.price}>
                                                    {item.price?.toLocaleString?.() ?? item.price}원
                                                </div>
                                                                                                 <div className={styles.sub}>
                                                                          <span>
                                                                            {item.createdAt ? formatTimeAgo(item.createdAt) : ""}
                                                                          </span>
                                                                                                </div>                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                </div>

                {page < totalPages - 1 && (
                    <button
                        className={`${styles.navBtn} ${styles.right}`}
                        onClick={goNext}
                    >
                        ›
                    </button>
                )}
            </div>

            <div className={styles.dots}>
                {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={i === page ? styles.dotActive : styles.dot}
                    />
                ))}
            </div>
        </section>
    );
}
