"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import type { FavoriteResponse } from "@/types";

interface UseFavoriteResult {
    favorited: boolean;
    count: number;
    loading: boolean;
    toggle: () => Promise<{ ok: boolean; needLogin?: boolean }>;
}

export default function useFavorite(productId: number | string | null | undefined): UseFavoriteResult {
    const [favorited, setFavorited] = useState(false);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        if (productId == null) {
            setFavorited(false);
            setCount(0);
            setLoading(false);
            return;
        }

        const fetchStatus = async () => {
            try {
                const response = await api.get<FavoriteResponse>(`/favorites/${productId}`);
                if (isMounted) {
                    setFavorited(!!response.data.favorited);
                    setCount(Number(response.data.count || 0));
                }
            } catch (e: unknown) {
                if (isMounted) setFavorited(false);
                const err = e as { response?: { data?: { message?: string }; status?: number }; message?: string };
                console.error("찜 정보 조회 실패:", err.response?.data?.message || err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchStatus();
        return () => { isMounted = false; };
    }, [productId]);

    const toggle = useCallback(async (): Promise<{ ok: boolean; needLogin?: boolean }> => {
        if (productId == null) return { ok: false };
        if (loading) return { ok: false };

        setLoading(true);
        const prevFav = favorited;
        const prevCnt = count;
        const optimisticFav = !prevFav;
        const optimisticCnt = prevCnt + (optimisticFav ? 1 : -1);
        setFavorited(optimisticFav);
        setCount(Math.max(0, optimisticCnt));

        try {
            const response = await api.post<FavoriteResponse>(`/favorites/${productId}/toggle`);
            setFavorited(!!response.data.favorited);
            setCount(Number(response.data.count || 0));
            return { ok: true };
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string }; status?: number }; message?: string };
            console.error("찜 토글 실패:", err.response?.data?.message || err.message);
            setFavorited(prevFav);
            setCount(prevCnt);
            if (err.response?.status === 401) return { ok: false, needLogin: true };
            return { ok: false };
        } finally {
            setLoading(false);
        }
    }, [productId, favorited, count, loading]);

    return { favorited, count, loading, toggle };
}
