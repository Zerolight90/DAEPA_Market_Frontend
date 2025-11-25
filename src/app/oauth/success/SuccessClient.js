// app/oauth/success/SuccessClient.js
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessClient() {
    const router = useRouter();
    const sp = useSearchParams();

    // 소셜 로그인 후 백엔드에서 /oauth/success 로 리다이렉트 시,
    // 백엔드는 이미 HttpOnly 쿠키를 발급한 상태입니다.
    // 프론트엔드는 URL에서 토큰을 파싱할 필요 없이,
    // 사용자를 원래 가려던 페이지나 메인 페이지로 보내주기만 하면 됩니다.
    useEffect(() => {
        // 'next' 파라미터가 있으면 해당 경로로, 없으면 홈으로 이동
        const nextPath = sp.get("next") || "/";
        router.replace(nextPath);
    }, [router, sp]);

    // 사용자에게 보여줄 로딩 메시지
    return <p style={{ padding: 24 }}>로그인 중입니다. 잠시만 기다려주세요...</p>;
}
