import { NextResponse } from "next/server";

export async function GET() {
    try {
        const res = await fetch("https://api.daepazone.shop/api/admin/banners/active", {
            cache: "no-store",
        });
        if (!res.ok) return NextResponse.json([]);
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json([]);
    }
}
