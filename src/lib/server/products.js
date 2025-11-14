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

    let path;

    if (lowId || middleId || upperId) {
        if (upperId) qs.set("upperId", String(upperId));
        if (middleId) qs.set("mid", String(middleId)); // 컨트롤러에서 name="mid" 로 받으니까 그대로
        if (lowId) qs.set("low", String(lowId));

        path = "/products";
    } else {
        if (!category) return { items: [], page, size, total: 0 };

        qs.set("big", category);
        path = "/products/by-name";
    }

    const fullPath = `${path}?${qs.toString()}`;

    const pageJson = await api(fullPath, {
        cache: "no-store",
        headers: { Accept: "application/json" },
    });

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
