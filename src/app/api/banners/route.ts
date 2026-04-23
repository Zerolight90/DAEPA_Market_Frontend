import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const cookieHeader = request.headers.get("cookie") ?? "";

    try {
        const res = await fetch("https://api.daepazone.shop/api/admin/banners/active", {
            cache: "no-store",
            headers: {
                ...(cookieHeader && { cookie: cookieHeader }),
            },
        });
        if (!res.ok) return NextResponse.json([]);
        const data = await res.json();
        return NextResponse.json(Array.isArray(data) ? data : []);
    } catch {
        return NextResponse.json([]);
    }
}
