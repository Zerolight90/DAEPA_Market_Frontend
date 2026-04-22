import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest): NextResponse {
    const { pathname } = req.nextUrl;

    const protectedPaths = ["/chat", "/like", "/mypage", "/sell"];
    const needsAuth = protectedPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!needsAuth) return NextResponse.next();

    const hasToken =
        req.cookies.has("ACCESS_TOKEN") ||
        req.cookies.has("REFRESH_TOKEN") ||
        req.cookies.has("accessToken") ||
        req.cookies.has("refreshToken");

    if (hasToken) return NextResponse.next();

    const url = req.nextUrl.clone();
    url.pathname = "/sign/login";
    url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(url);
}

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
