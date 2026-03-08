import "server-only";
// api 임포트는 이제 안 씁니다.

export async function fetchProducts({
    category, upperId, middleId, lowId, page = 1, size = 20, sort = "recent", min, max, dDeal, excludeSold = false,
}) {
    const qs = new URLSearchParams({
        page: String(Math.max(1, page) - 1),
        size: String(size),
    });

    if (sort && sort !== "recent") qs.set("sort", sort);
    if (typeof min !== "undefined" && min !== null) qs.set("min", String(min));
    if (typeof max !== "undefined" && max !== null) qs.set("max", String(max));
    if (dDeal) qs.set("dDeal", dDeal);
    if (excludeSold) qs.set("excludeSold", "true");

    const decodedCategory = (() => {
        if (!category) return category;
        try { return decodeURIComponent(category); } catch (e) { return category; }
    })();

    const hasCategoryIds = Boolean(lowId || middleId || upperId);
    let path = hasCategoryIds ? "/products" : "/products/by-name";

    if (hasCategoryIds) {
        if (upperId) qs.set("upperId", String(upperId));
        if (middleId) qs.set("mid", String(middleId));
        if (lowId) qs.set("low", String(lowId));
    } else if (decodedCategory) {
        qs.set("big", decodedCategory);
    } else {
        return { items: [], page, size, total: 0 };
    }

    // 🚨 핵심: 서버 사이드에서는 무조건 절대 주소(http://...)가 필요합니다!
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
    const fullUrl = `${backendUrl}/api${path}?${qs.toString()}`;

    try {
        // Next.js 서버 컴포넌트 권장 방식인 기본 fetch 사용
        const response = await fetch(fullUrl, {
            cache: "no-store",
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            throw new Error(`API 응답 에러: ${response.status}`);
        }

        const pageJson = await response.json();

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
    } catch (error) {
        console.error(`[fetchProducts] API call failed for ${fullUrl}:`, error);
        return {
            items: [],
            total: 0,
            page: 1,
            size: size,
            error: "Failed to fetch products.",
        };
    }
}