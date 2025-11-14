// src/hooks/useFavorite.js
"use client";

import { useEffect, useState, useCallback } from "react";
import tokenStore from "@/app/store/TokenStore";
import { api } from "@/lib/api/client";

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
                const data = await api(`/favorites/${productId}`, {
                    credentials: "include",
                    cache: "no-store",
                    headers,
                });

                if (!off) {
                    setFavorited(!!data.favorited);
                    setCount(Number(data.count || 0));
                }
            } catch (e) {
                // api 유틸리티가 에러를 던지므로 catch 블록에서 처리
                console.error("찜 정보 조회 실패:", e);
            }
            finally {
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

            const data = await api(
                `/favorites/${productId}/toggle`,
                {
                    method: "POST",
                    credentials: "include",
                    headers,
                }
            );

            setFavorited(!!data.favorited);
            setCount(Number(data.count || 0));
            return { ok: true };
        } catch (e) {
            // api 유틸리티는 401과 같은 HTTP 에러도 throw하므로 여기서 잡습니다.
            // 실제 에러 응답을 파싱하여 로그인 필요 여부를 판단할 수도 있습니다.
            // 예: if (e.message.includes("401")) { ... }
            console.error("찜 토글 실패:", e);
            
            setFavorited(prevFav);
            setCount(prevCnt);
            
            // 401 에러 메시지를 확인하여 로그인 필요 여부 반환
            if (e.message && e.message.includes("401")) {
                return { ok: false, needLogin: true };
            }
            return { ok: false };
        } finally {
            setLoading(false);
        }
    }, [productId, favorited, count, loading, accessToken]);

    return { favorited, count, loading, toggle };
}
