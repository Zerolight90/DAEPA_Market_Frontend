// src/hooks/useFavorite.js
"use client";

import { useEffect, useState, useCallback } from "react";
import tokenStore from "@/app/store/TokenStore";

// 백엔드 고정
const API_BASE = "http://localhost:8080";

export default function useFavorite(productId) {
    // 1) 여기서 토큰 뽑아옴
    const accessToken = tokenStore((state) => state.accessToken);

    const [favorited, setFavorited] = useState(false);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // 초기 조회
    useEffect(() => {
        let off = false;
        if (productId == null) {
            setFavorited(false);
            setCount(0);
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const headers = {};
                if (accessToken) {
                    headers.Authorization = `Bearer ${accessToken}`;
                }
                const res = await fetch(`${API_BASE}/api/favorites/${productId}`, {
                    credentials: "include",
                    cache: "no-store",
                    headers,
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!off) {
                    setFavorited(!!data.favorited);
                    setCount(Number(data.count || 0));
                }
            } finally {
                if (!off) setLoading(false);
            }
        })();

        return () => {
            off = true;
        };
    }, [productId, accessToken]);

    // 토글
    const toggle = useCallback(async () => {
        if (productId == null) return { ok: false };
        if (loading) return { ok: false };

        // 지금 토큰이 있는지 먼저 확인 👇
        console.log("❤️ toggle favorite, token = ", accessToken);

        setLoading(true);
        const prevFav = favorited;
        const prevCnt = count;
        const optimisticFav = !prevFav;
        const optimisticCnt = prevCnt + (optimisticFav ? 1 : -1);
        setFavorited(optimisticFav);
        setCount(Math.max(0, optimisticCnt));

        try {
            const headers = {
                "Content-Type": "application/json",
            };
            if (accessToken) {
                headers.Authorization = `Bearer ${accessToken}`;
            }

            const res = await fetch(
                `${API_BASE}/api/favorites/${productId}/toggle`,
                {
                    method: "POST",
                    credentials: "include",
                    headers,
                }
            );

            if (res.status === 401) {
                // 여기서 alert 띄우는 거지
                setFavorited(prevFav);
                setCount(prevCnt);
                return { ok: false, needLogin: true };
            }
            if (!res.ok) {
                setFavorited(prevFav);
                setCount(prevCnt);
                return { ok: false };
            }
            const data = await res.json();
            setFavorited(!!data.favorited);
            setCount(Number(data.count || 0));
            return { ok: true };
        } catch (e) {
            setFavorited(prevFav);
            setCount(prevCnt);
            return { ok: false };
        } finally {
            setLoading(false);
        }
    }, [productId, favorited, count, loading, accessToken]);

    return { favorited, count, loading, toggle };
}
