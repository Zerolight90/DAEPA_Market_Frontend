// app/oauth/success/SuccessClient.js
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import tokenStore from "@/store/TokenStore";
import useAuthStore from "@/store/useAuthStore";

export default function SuccessClient() {
    const router = useRouter();
    const sp = useSearchParams();

    // 소셜 로그인 후 백엔드에서 /oauth/success 로 리다이렉트 시,
    // 백엔드는 이미 HttpOnly 쿠키(ACCESS_TOKEN + REFRESH_TOKEN)를 발급한 상태입니다.
    // /sign/me 를 호출해 응답 바디의 accessToken을 TokenStore에 저장하고,
    // 사용자 정보로 useAuthStore를 초기화한 뒤 원래 경로로 이동합니다.
    useEffect(() => {
        const nextPath = sp.get("next") || "/";

        (async () => {
            try {
                // withCredentials: true 덕분에 HttpOnly 쿠키가 자동 전송됨
                const { data } = await api.get("/sign/me");

                // accessToken을 Zustand Store에 저장 (이후 API 요청에 Authorization 헤더로 사용)
                if (data?.accessToken) {
                    tokenStore.getState().setAccessToken(data.accessToken);
                }

                // /sign/me 응답은 data 자체가 사용자 정보 (data.user 중첩 구조 아님)
                useAuthStore.getState().login({
                    uIdx: data?.uIdx,
                    uNickname: data?.uNickname,
                    u_nickname: data?.u_nickname,
                    u_profile: data?.u_profile,
                    uId: data?.uId,
                });
            } catch (e) {
                // /sign/me 실패 시에도 일단 이동 (세션 만료 등 예외 처리는 api.js 인터셉터가 담당)
            } finally {
                router.replace(nextPath);
            }
        })();
    }, [router, sp]);

    return <p style={{ padding: 24 }}>로그인 중입니다. 잠시만 기다려주세요...</p>;
}
