import { NextResponse } from "next/server";

export function middleware(req) {
    const { pathname } = req.nextUrl;

    // 1. 보호할 경로 목록 (하위 경로 포함)
    const protectedPaths = ["/chat", "/like", "/mypage", "/sell"];
    const needsAuth = protectedPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );
    
    // 보호할 경로가 아니면 프리패스
    if (!needsAuth) return NextResponse.next();

    // 2. ✅ Next.js 공식 메서드로 안전하게 쿠키 존재 여부 확인
    const hasToken = 
        req.cookies.has("ACCESS_TOKEN") || 
        req.cookies.has("REFRESH_TOKEN") || 
        req.cookies.has("accessToken") || 
        req.cookies.has("refreshToken");

    // 로그인 상태(쿠키 있음)면 프리패스
    if (hasToken) {
        return NextResponse.next();
    }

    // 3. 비로그인(쿠키 없음) → 로그인 페이지로 쫓아내기 (돌아올 목적지 기억)
    const url = req.nextUrl.clone();
    url.pathname = "/sign/login";
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