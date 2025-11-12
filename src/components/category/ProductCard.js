// src/components/category/ProductCard.js
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { API_BASE, Endpoints } from "@/app/sell/api";
import tokenStore from "@/app/store/TokenStore";
import styles from "./ProductCard.module.css";

export default function ProductCard({ item, hrefBase = "/store" }) {
    const [fav, setFav] = useState(false);
    const [count, setCount] = useState(0);

    // d_sell 파싱
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
    const isSold = sellState === 1;    // 판매완료
    const isTrading = sellState === 2; // 거래중/판매 중 으로 보여줄 것

    const accessToken = tokenStore((state) => state.accessToken);

    // 찜 상태 초기 조회
    useEffect(() => {
        if (!item?.id && !item?.pdIdx) return;

        (async () => {
            try {
                const headers = {};
                if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

                const productId = item.id ?? item.pdIdx;
                const res = await fetch(
                    `${API_BASE}${Endpoints.favoriteStatus(productId)}`,
                    {
                        credentials: "include",
                        cache: "no-store",
                        headers,
                    }
                );
                if (res.ok) {
                    const data = await res.json();
                    setFav(!!data.favorited);
                    setCount(data.count ?? 0);
                }
            } catch (e) {
                console.error("찜 상태 조회 실패:", e);
            }
        })();
    }, [item?.id, item?.pdIdx, accessToken]);

    // 찜 토글
    const onToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const productId = item.id ?? item.pdIdx;
        const url = `${API_BASE}${Endpoints.favoriteToggle(productId)}`;

        try {
            const headers = { "Content-Type": "application/json" };
            if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

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
            setFav(!!data.favorited);
            setCount(data.count ?? 0);
        } catch (err) {
            console.error("[favoriteToggle] fetch error:", err);
            alert("찜 처리 중 오류가 발생했습니다.");
        }
    };

    // 화면용 필드
    const productId = item.id ?? item.pdIdx;
    const productTitle = item.title ?? item.pdTitle;
    const productPrice = item.price ?? item.pdPrice;
    const productThumb = item.thumbnail ?? item.pdThumb ?? "/no-image.png";

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
                                ✓
                            </div>
                            <div>{isSold ? "판매완료" : "판매 중"}</div>
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
                        <span>{item.location ?? item.pdLocation}</span>
                        <span className={styles.dot}>•</span>
                        <span>{item.createdAt?.slice(0, 10) ?? item.pdCreate ?? ""}</span>
                    </div>
                </div>
            </Link>
        </li>
    );
}
