// src/hooks/useFavorite.js
"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api"; // 중앙 axios 인스턴스를 사용합니다.

export default function useFavorite(productId) {
    // ❗ 더 이상 accessToken을 직접 관리할 필요가 없습니다.
    // const accessToken = tokenStore((state) => state.accessToken);

    const [favorited, setFavorited] = useState(false);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // 초기 조회
    useEffect(() => {
        let isMounted = true; // 컴포넌트 마운트 상태 추적
        if (productId == null) {
            setFavorited(false);
            setCount(0);
            setLoading(false);
            return;
        }

        const fetchStatus = async () => {
            try {
                // ❗ axios 인스턴스로 교체. withCredentials: true가 적용되어 쿠키가 자동으로 전송됩니다.
                // ❗ Authorization 헤더를 수동으로 추가할 필요가 없습니다.
                const response = await api.get(`/favorites/${productId}`);
                
                if (isMounted) {
                    setFavorited(!!response.data.favorited);
                    setCount(Number(response.data.count || 0));
                }
            } catch (e) {
                // 401 (Unauthorized) 같은 에러는 axios 인스턴스에서 처리하거나 여기서 개별 처리 가능
                // 이 경우, 로그인하지 않은 사용자로 간주하고 상태를 초기화합니다.
                if (isMounted) {
                    setFavorited(false);
                    // setCount(0); // 카운트는 유지할 수도 있습니다. 정책에 따라 결정.
                }
                console.error("찜 정보 조회 실패:", e.response?.data?.message || e.message);
            }
            finally {
                if (isMounted) setLoading(false);
            }
        };
        
        fetchStatus();

        return () => {
            isMounted = false;
        };
    }, [productId]); // accessToken 의존성 제거

    // 토글
    const toggle = useCallback(async () => {
        if (productId == null) return { ok: false };
        if (loading) return { ok: false };

        // ❗ 더 이상 토큰을 직접 확인할 필요가 없습니다. 요청이 실패하면 catch 블록에서 처리합니다.

        setLoading(true);
        const prevFav = favorited;
        const prevCnt = count;
        // Optimistic UI 업데이트
        const optimisticFav = !prevFav;
        const optimisticCnt = prevCnt + (optimisticFav ? 1 : -1);
        setFavorited(optimisticFav);
        setCount(Math.max(0, optimisticCnt));

        try {
            // ❗ axios 인스턴스로 교체. 헤더 설정 불필요.
            const response = await api.post(`/favorites/${productId}/toggle`);

            // 서버의 최종 응답으로 상태를 다시 동기화
            setFavorited(!!response.data.favorited);
            setCount(Number(response.data.count || 0));
            return { ok: true };
        } catch (e) {
            console.error("찜 토글 실패:", e.response?.data?.message || e.message);
            
            // 실패 시 원래 상태로 롤백
            setFavorited(prevFav);
            setCount(prevCnt);
            
            // 401 에러가 발생하면 로그인 필요 상태를 반환
            if (e.response?.status === 401) {
                return { ok: false, needLogin: true };
            }
            return { ok: false };
        } finally {
            setLoading(false);
        }
    }, [productId, favorited, count, loading]);

    return { favorited, count, loading, toggle };
}
