// src/lib/server/products.js
import "server-only";

// ✅ 서버에서 반드시 절대 URL로 호출되도록 기본값을 강제
const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.API_BASE ||
    "http://localhost:8080";

/**
 * 상품 목록 조회
 * @param {Object} opts
 * @param {string} opts.category   - upper 카테고리명 (아이디가 없을 때 fallback)
 * @param {string|number} [opts.upperId]
 * @param {string|number} [opts.middleId]
 * @param {string|number} [opts.lowId]
 * @param {number} [opts.page=1]   - 1-base (Spring은 내부에서 0-base 변환)
 * @param {number} [opts.size=20]
 * @param {"recent"|"price_asc"|"price_desc"} [opts.sort="recent"]
 */
export async function fetchProducts({
                                        category,
                                        upperId,
                                        middleId,
                                        lowId,
                                        page = 1,
                                        size = 20,
                                        sort = "recent",
                                    }) {
    // 공통 쿼리스트링
    const qs = new URLSearchParams({
        page: String(Math.max(1, page) - 1), // Spring은 0-based
        size: String(size),
    });

    // 정렬(백엔드가 recent/price_asc/price_desc를 이해한다고 가정)
    if (sort && sort !== "recent") qs.set("sort", sort);

    let url;

    if (lowId || middleId || upperId) {
        // ✅ ID 기반 필터 사용: /api/products?upperId=&middleId=&lowId=
        if (upperId) qs.set("upperId", String(upperId));
        if (middleId) qs.set("middleId", String(middleId));
        if (lowId) qs.set("lowId", String(lowId));

        url = new URL("/api/products", API_BASE);
        url.search = qs.toString();
    } else {
        // ✅ 이름 기반(fallback): /api/products/by-name?big=카테고리명
        if (!category) return { items: [], page, size, total: 0 };

        qs.set("big", category); // 기존 서버 규약 유지
        url = new URL("/api/products/by-name", API_BASE);
        url.search = qs.toString();
    }

    const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw new Error(`[products] ${res.status} ${msg}`);
    }

    const pageJson = await res.json();

    // 응답이 Page 형태({content, totalElements, number, size})거나
    // 배열만 오는 경우 모두 안전 처리
    const items = Array.isArray(pageJson?.content)
        ? pageJson.content
        : Array.isArray(pageJson)
            ? pageJson
            : [];

    return {
        items: items.map((p) => ({
            ...p,
            id: p.pdIdx,
            title: p.pdTitle,
            price: p.pdPrice,
            thumbnail: p.pdThumb,
            location: p.pdLocation,
            createdAt: p.pdCreate,
        })),
        total: pageJson?.totalElements ?? 0,
        page: (pageJson?.number ?? Math.max(1, page) - 1) + 1,
        size: pageJson?.size ?? size,
    };
}
