"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import tokenStore from "@/app/store/TokenStore";

function Inner() {
    const router = useRouter();
    const sp = useSearchParams();
    const { setToken } = tokenStore();

    // StrictMode 등으로 인한 중복 실행 가드
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        const accessToken = sp.get("accessToken");
        const refreshToken = sp.get("refreshToken");
        const provider = sp.get("provider") || "naver";

        if (accessToken) {
            localStorage.setItem("accessToken", accessToken);
            setToken(accessToken);
        }
        if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        }

        // 마무리 후 메인 OAuth 페이지로 이동
        router.replace(`/oauth?provider=${provider}`);
    }, [router, setToken, sp]);

    return <p style={{ padding: 24 }}>소셜 로그인 중입니다...</p>;
}

export default function Page() {
    return (
        <Suspense fallback={<p style={{ padding: 24 }}>로딩 중…</p>}>
            <Inner />
        </Suspense>
    );
}
