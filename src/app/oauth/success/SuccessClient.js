// app/oauth/success/SuccessClient.js
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import tokenStore from "@/app/store/TokenStore";

export default function SuccessClient() {
    const router = useRouter();
    const sp = useSearchParams();
    const { setToken } = tokenStore();

    const accessToken = sp.get("accessToken");
    const refreshToken = sp.get("refreshToken");
    const provider = sp.get("provider") || "naver";

    useEffect(() => {
        if (accessToken) {
            localStorage.setItem("accessToken", accessToken);
            setToken(accessToken);
        }
        if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        }

        // 소셜에서 넘어온 뒤 실제 입력 페이지로
        router.replace(`/oauth?provider=${provider}`);
    }, [accessToken, refreshToken, provider, router, setToken]);

    return <p style={{ padding: 24 }}>소셜 로그인 중입니다...</p>;
}
