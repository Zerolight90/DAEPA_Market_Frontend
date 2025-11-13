// src/lib/server/sellers.js
import "server-only";
import { api } from "@/lib/api/client";

export async function fetchSellerProducts({
                                              sellerId,
                                              page = 0,
                                              size = 20,
                                              sort = "recent",
                                              status,
                                          }) {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("size", String(size));

    const path = `/sellers/${sellerId}/products?${qs.toString()}`;

    try {
        const data = await api(path, {
            cache: "no-store",
            headers: { Accept: "application/json" },
        });

        const items = Array.isArray(data?.content)
            ? data.content
            : Array.isArray(data)
                ? data
                : [];

        // 혹시라도 pd_del이 섞여 있으면 한 번 더
        const cleaned = items.filter((p) => {
            const raw =
                p.pdDel ??
                p.pd_del ??
                p.product?.pdDel ??
                p.product?.pd_del ??
                0;
            const val = String(raw).trim().toLowerCase();
            const isDeleted =
                val === "1" ||
                val === "true" ||
                val === "y" ||
                val === "yes";
            return !isDeleted;
        });

        return cleaned.map((p) => ({
            ...p,
            id: p.pdIdx ?? p.id ?? p.pd_idx,
            title: p.pdTitle ?? p.title ?? p.pd_title,
            price: p.pdPrice ?? p.price ?? p.pd_price,
            thumbnail: p.pdThumb ?? p.thumbnail ?? p.pd_thumb,
            createdAt: p.pdCreate ?? p.createdAt ?? p.pd_create,
        }));
    } catch (error) {
        console.error(`[fetchSellerProducts] API Error:`, error);
        return []; // 에러 발생 시 빈 배열 반환
    }
}

export async function fetchProductDetail(productId) {
    if (!productId) return null;

    try {
        const data = await api(`/products/${productId}`, {
            cache: "no-store",
            headers: { Accept: "application/json" },
        });
        return data;
    } catch (error) {
        console.error(`[fetchProductDetail] API Error for product ${productId}:`, error);
        return null; // 에러 발생 시 null 반환
    }
}
