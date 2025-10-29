"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * 제품별 찜 상태/개수 훅
 * - 마운트 시 GET /api/favorites/:id 로 { favorited, count } 로드
 * - 클릭 시 POST /api/favorites/:id/toggle
 */
export default function useFavorite(productId) {
    const [favorited, setFavorited] = useState(false);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // 초기 로드 (비로그인도 허용)
    useEffect(() => {
        let off = false;
        if (!productId && productId !== 0) {
            setFavorited(false);
            setCount(0);
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const res = await fetch(`/api/favorites/${productId}`, {
                    credentials: "include",
                    cache: "no-store",
                });
                if (!res.ok) return;
                const data = await res.json(); // { favorited, count }
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
    }, [productId]);

    // 토글 (로그인 필요)
    const toggle = useCallback(async () => {
        if (!productId && productId !== 0) return { ok: false };
        if (loading) return { ok: false };
        setLoading(true);

        // 낙관적 업데이트
        const prevFav = favorited;
        const prevCnt = count;
        const optimisticFav = !prevFav;
        const optimisticCnt = prevCnt + (optimisticFav ? 1 : -1);
        setFavorited(optimisticFav);
        setCount(Math.max(0, optimisticCnt));

        try {
            const res = await fetch(`/api/favorites/${productId}/toggle`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });
            if (res.status === 401) {
                // 롤백
                setFavorited(prevFav);
                setCount(prevCnt);
                return { ok: false, needLogin: true };
            }
            if (!res.ok) {
                setFavorited(prevFav);
                setCount(prevCnt);
                return { ok: false };
            }
            const data = await res.json(); // { favorited, count }
            setFavorited(!!data.favorited);
            setCount(Number(data.count || 0));
            return { ok: true };
        } catch {
            setFavorited(prevFav);
            setCount(prevCnt);
            return { ok: false };
        } finally {
            setLoading(false);
        }
    }, [productId, favorited, count, loading]);

    return { favorited, count, loading, toggle };
}
