// src/components/category/ProductCard.js
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { api, Endpoints } from "@/app/sell/api";
import tokenStore from "@/store/TokenStore";
import styles from "./ProductCard.module.css";

export default function ProductCard({ item, hrefBase = "/store" }) {
    const [fav, setFav] = useState(false);
    const [count, setCount] = useState(0);

    const rawSell =
        item?.dSell ??
        item?.d_sell ??
        item?.dsell ??
        item?.dStatus ??
        item?.d_status ??
        item?.dstatus ??
        item?.dealStatus ??
        0;

    const sellState = Number(rawSell) || 0;
    const isSold = sellState === 1;
    const isTrading = sellState === 2;
    const accessToken = tokenStore((state) => state.accessToken);

    // 찜 상태 초기 조회
    useEffect(() => {
        const productId = item?.id ?? item?.pdIdx;
        const numericId = Number(productId);
        if (!numericId || Number.isNaN(numericId)) return;

        (async () => {
            try {
                const res = await api.get(Endpoints.favoriteStatus(numericId));
                setFav(!!res.data.favorited);
                setCount(res.data.count ?? 0);
            } catch (e) {
                // 즐겨찾기 조회 실패 시 조용히 기본값으로 유지 (백엔드 404/500 등 방어)
                setFav(false);
                setCount(0);
            }
        })();
        // 토큰이 바뀌어도 재조회하지 않도록 ID만 의존
    }, [item?.id, item?.pdIdx]);

    const onToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const productId = item?.id ?? item?.pdIdx;
        if (!productId) return;

        const url = Endpoints.favoriteToggle(productId);

        try {
            const res = await api.post(url);
            const data = res.data;
            setFav(!!data.favorited);
            setCount(data.count ?? 0);
        } catch (err) {
            if (err.response?.status === 401) {
                alert("로그인이 필요합니다.");
                return;
            }
            console.error("[favoriteToggle] axios error:", err);
            alert(`요청 처리 중 오류가 발생했습니다.\n${err.response?.data?.message || err.message}`);
        }
    };

    const productId = item?.id ?? item?.pdIdx;
    const productTitle = item?.title ?? item?.pdTitle;
    const productPrice = item?.price ?? item?.pdPrice;
    const productThumb = item?.thumbnail ?? item?.pdThumb ?? "/images/no-image.png";

    return (
        <li className={styles.card}>
            <Link href={`${hrefBase}/${productId}`} className={styles.link}>
                <div className={styles.thumbWrap} style={{ position: "relative" }}>
                    <img
                        src={productThumb}
                        alt={productTitle}
                        className={styles.thumb}
                        style={{
                            filter: isSold || isTrading ? "brightness(0.45)" : "none",
                            transition: "filter .15s",
                        }}
                    />

                    {(isSold || isTrading) && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(0,0,0,0.45)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                borderRadius: "12px 12px 0 0",
                                color: "#fff",
                                fontWeight: 600,
                            }}
                        >
                            <div
                                style={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: "9999px",
                                    border: "2px solid #fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 20,
                                    lineHeight: 1,
                                }}
                            >
                                예약
                            </div>
                            <div>{isSold ? "거래 완료" : "거래 중"}</div>
                        </div>
                    )}

                    <button
                        className={styles.heartBtn}
                        onClick={onToggle}
                        aria-label="찜하기"
                        title="찜하기"
                    >
                        {fav ? (
                            <FavoriteIcon className={styles.heartOn} />
                        ) : (
                            <FavoriteBorderIcon className={styles.heartOff} />
                        )}
                        <span className={styles.heartCnt}>{count}</span>
                    </button>
                </div>

                <div className={styles.meta}>
                    <h3 className={styles.name}>{productTitle}</h3>
                    <div className={styles.price}>
                        {productPrice?.toLocaleString?.() ?? productPrice}원
                    </div>
                    <div className={styles.sub}>
                        <span>{item?.location ?? item?.pdLocation}</span>
                        {item?.pdCreate && <span>{item.pdCreate}</span>}
                    </div>
                </div>
            </Link>
        </li>
    );
}
