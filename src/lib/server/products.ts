import "server-only";
import type { FetchProductsParams, ProductListResult, Product } from "@/types";

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
}: FetchProductsParams): Promise<ProductListResult> {
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
        try { return decodeURIComponent(category); } catch { return category; }
    })();

    const hasCategoryIds = Boolean(lowId || middleId || upperId);
    let path = hasCategoryIds || !decodedCategory ? "/products" : "/products/by-name";

    if (hasCategoryIds) {
        if (upperId) qs.set("upperId", String(upperId));
        if (middleId) qs.set("mid", String(middleId));
        if (lowId) qs.set("low", String(lowId));
    } else if (decodedCategory) {
        qs.set("big", decodedCategory);
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
    const fullUrl = `${backendUrl}/api${path}?${qs.toString()}`;

    try {
        const response = await fetch(fullUrl, {
            cache: "no-store",
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            throw new Error(`API 응답 에러: ${response.status}`);
        }

        const pageJson = await response.json();

        const rawItems: Record<string, unknown>[] = Array.isArray(pageJson?.content)
            ? pageJson.content
            : Array.isArray(pageJson)
                ? pageJson
                : [];

        return {
            items: rawItems.map((p): Product => {
                const item = p as unknown as Product;
                return {
                ...item,
                id: p.pdIdx as number,
                title: p.pdTitle as string,
                price: p.pdPrice as number,
                thumbnail: p.pdThumb as string,
                location: p.pdLocation as string,
                createdAt: p.pdCreate as string,
                };
            }),
            total: (pageJson?.totalElements as number) ?? 0,
            page: ((pageJson?.number as number) ?? Math.max(1, page) - 1) + 1,
            size: (pageJson?.size as number) ?? size,
        };
    } catch (error) {
        console.error(`[fetchProducts] API call failed for ${fullUrl}:`, error);
        return { items: [], total: 0, page: 1, size, error: "Failed to fetch products." };
    }
}
