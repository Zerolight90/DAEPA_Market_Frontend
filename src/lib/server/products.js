// src/lib/server/products.js
import "server-only";
import { api } from "@/lib/api/client";

/**
 * Fetch product list for category filters.
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

    if (typeof min !== "undefined" && min !== null) {
        qs.set("min", String(min));
    }
    if (typeof max !== "undefined" && max !== null) {
        qs.set("max", String(max));
    }

    if (dDeal) {
        qs.set("dDeal", dDeal); // "MEET" or "DELIVERY"
    }

    if (excludeSold) {
        qs.set("excludeSold", "true");
    }

    const decodedCategory = (() => {
        if (!category) return category;
        try {
            return decodeURIComponent(category);
        } catch (e) {
            return category;
        }
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
