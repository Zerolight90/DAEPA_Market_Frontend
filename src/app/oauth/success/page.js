"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import tokenStore from "@/app/store/TokenStore";

export default function OAuthSuccessPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const { setToken } = tokenStore();

    const accessToken = sp.get("accessToken");
    const refreshToken = sp.get("refreshToken");
    const provider = sp.get("provider") || "naver";

    useEffect(() => {
        // 1) 토큰 저장
        if (accessToken) {
            localStorage.setItem("accessToken", accessToken);
            setToken(accessToken);
        }
        if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        }

        // 2) 실제 추가정보 페이지로
        router.replace(`/oauth?provider=${provider}`);
    }, [accessToken, refreshToken, provider, router, setToken]);

    return <p style={{ padding: 24 }}>소셜 로그인 중입니다...</p>;
}
