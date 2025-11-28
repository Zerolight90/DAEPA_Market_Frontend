//src/lib/server/products.js
import "server-only";
import { api } from "@/lib/api/client";

/**
 * 상품 목록 조회
 */
export async function fetchProducts({
                                        category,
                                        upperId,
                                        middleId,
                                        lowId,
                                        page = 1,
                                        size = 20,
                                        sort = "recent",
                                        min,
                                        max,
                                        dDeal,
                                        excludeSold = false,
                                    }) {
    const qs = new URLSearchParams({
        page: String(Math.max(1, page) - 1),
        size: String(size),
    });

    if (sort && sort !== "recent") qs.set("sort", sort);

    // 가격
    if (typeof min !== "undefined" && min !== null) {
        qs.set("min", String(min));
    }
    if (typeof max !== "undefined" && max !== null) {
        qs.set("max", String(max));
    }

    // 거래방식
    if (dDeal) {
        qs.set("dDeal", dDeal); // "MEET" 또는 "DELIVERY"
    }

    // 판매완료 제외
    if (excludeSold) {
        qs.set("excludeSold", "true");
    }

    let path = "/products";

    if (lowId || middleId || upperId) {
        if (upperId) qs.set("upperId", String(upperId));
        if (middleId) qs.set("middleId", String(middleId));
        if (lowId) qs.set("lowId", String(lowId));
    } else if (category) {
        qs.set("upperId", category);
    } else {
        // 카테고리 정보가 아예 없으면 빈 목록 리턴
        return { items: [], page, size, total: 0 };
    }

    const fullPath = `${path}?${qs.toString()}`;

    try {
        const response = await api.get(fullPath, {
            cache: "no-store",
            headers: { Accept: "application/json" },
        });
        const pageJson = response.data;

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
        console.error(`[fetchProducts] API call failed for ${fullPath}:`, error);
        return {
            items: [],
            total: 0,
            page: 1,
            size: size,
            error: "Failed to fetch products.",
        };
    }
}
