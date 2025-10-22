// lib/server/products.js
import "server-only";

// ✅ 서버에서 반드시 절대 URL로 호출되도록 기본값을 강제
const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE             // 프론트/서버 겸용으로 쓰는 경우
    || process.env.API_BASE                      // 서버 전용 환경변수로 써도 됨
    || "http://localhost:8080";                  // 개발 기본값

export async function fetchProducts({ category, page = 1, size = 20, sort = "recent" }) {
    if (!category) return { items: [], page, size, total: 0 };

    const qs = new URLSearchParams({
        big: category,
        page: String(page - 1), // Spring은 0-based
        size: String(size),
        sort,
    });

    // ✅ 절대 URL 조립 (상대 X)
    const url = new URL("/api/products/by-name", API_BASE);
    url.search = qs.toString();

    const res = await fetch(url.toString(), { cache: "no-store", headers: { Accept: "application/json" } });
    if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw new Error(`[products] ${res.status} ${msg}`);
    }

    const pageJson = await res.json();
    return {
        items: (pageJson.content || []).map(p => ({
            id: p.pdIdx,
            title: p.pdTitle,
            price: p.pdPrice,
            thumbnail: p.pdThumb,
            location: p.pdLocation,
            createdAt: p.pdCreate,
        })),
        total: pageJson.totalElements ?? 0,
        page: (pageJson.number ?? 0) + 1,
        size: pageJson.size ?? size,
    };
}
