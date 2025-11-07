// src/middleware.js
// 비로그인 시 /sing/login?next=<원래경로> 로 리다이렉트

import { NextResponse } from "next/server";

/** 쿠키 존재 여부를 안전하게 확인 */
function hasCookie(req, name) {
    const c = req.cookies.get(name);
    return c && typeof c.value === "string" && c.value.length > 0;
}

/** 로그인 여부 판정: 프로젝트의 실제 쿠키 이름에 맞추어 수정 가능 */
function isAuthenticated(req) {
    return (
        hasCookie(req, "ACCESS_TOKEN") ||
        hasCookie(req, "REFRESH_TOKEN") ||
        hasCookie(req, "accessToken") ||
        hasCookie(req, "refreshToken")
    );
}

export function middleware(req) {
    const { pathname } = req.nextUrl;

    // 보호할 경로 목록 (하위 경로 포함)
    const protectedPaths = ["/chat", "/like", "/mypage", "/sell"];
    const needsAuth = protectedPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (!needsAuth) return NextResponse.next();

    // 로그인 상태면 통과
    if (isAuthenticated(req)) {
        return NextResponse.next();
    }

    // 비로그인 → 로그인 페이지로 리다이렉트 (돌아올 next 파라미터 포함)
    const url = req.nextUrl.clone();
    url.pathname = "/sing/login";
    url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(url);
}

/**
 * matcher: 미들웨어가 적용될 라우트 정의
 * - 정적 리소스/Next 내부 경로를 실수로 매칭하지 않게, 보호 경로만 지정
 */
export const config = {
    matcher: [
        "/chat",
        "/chat/:path*",
        "/like",
        "/like/:path*",
        "/mypage",
        "/mypage/:path*",
        "/sell",
        "/sell/:path*",
    ],
};
