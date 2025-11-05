// src/components/category/ProductCard.js
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { API_BASE, Endpoints } from "@/app/sell/api";
import tokenStore from "@/app/store/TokenStore"; // ✅ 토큰 가져오기
import styles from "./ProductCard.module.css";

export default function ProductCard({ item, hrefBase = "/store" }) {
    const [fav, setFav] = useState(false);
    const [count, setCount] = useState(0);

    // ✅ zustand에서 토큰 구독
    const accessToken = tokenStore((state) => state.accessToken);

    // 처음 찜 상태 가져오기
    useEffect(() => {
        if (!item?.id) return;

        (async () => {
            try {
                const headers = {};
                // 토큰 있으면 GET에도 같이 실어주자 (비로그인도 되긴 하지만 일관성 있게)
                if (accessToken) {
                    headers.Authorization = `Bearer ${accessToken}`;
                }

                const res = await fetch(
                    `${API_BASE}${Endpoints.favoriteStatus(item.id)}`,
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
    }, [item?.id, accessToken]);

    // 하트 클릭
    const onToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const url = `${API_BASE}${Endpoints.favoriteToggle(item.id)}`;

        try {
            const headers = {
                "Content-Type": "application/json",
            };
            // ✅ 여기서 토큰을 꼭 붙여준다
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
            setFav(!!data.favorited);
            setCount(data.count ?? 0);
        } catch (err) {
            console.error("[favoriteToggle] fetch error:", err);
            alert(`찜 처리 중 오류가 발생했습니다.\n${String(err)}`);
        }
    };

    return (
        <li className={styles.card}>
            <Link href={`${hrefBase}/${item.id}`} className={styles.link}>
                <div className={styles.thumbWrap}>
                    <img
                        src={item.thumbnail || "/no-image.png"}
                        alt={item.title}
                        className={styles.thumb}
                    />

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
                    <h3 className={styles.name}>{item.title}</h3>
                    <div className={styles.price}>
                        {item.price?.toLocaleString?.() ?? item.price}원
                    </div>
                    <div className={styles.sub}>
                        <span>{item.location}</span>
                        <span className={styles.dot}>•</span>
                        <span>{item.createdAt?.slice(0, 10) ?? ""}</span>
                    </div>
                </div>
            </Link>
        </li>
    );
}
