import "server-only";
import { api } from "@/lib/api/client";
import type { Product } from "@/types";

interface FetchSellerProductsParams {
    sellerId: number | string;
    page?: number;
    size?: number;
    sort?: string;
    status?: string;
}

export async function fetchSellerProducts({
    sellerId,
    page = 0,
    size = 20,
    sort = "recent",
    status,
}: FetchSellerProductsParams): Promise<Product[]> {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("size", String(size));

    const path = `/sellers/${sellerId}/products?${qs.toString()}`;

    try {
        const data = await api(path, {
            cache: "no-store",
            headers: { Accept: "application/json" },
        } as never);

        const responseData = (data as { data: unknown }).data;
        const items: Record<string, unknown>[] = Array.isArray((responseData as Record<string, unknown>)?.content)
            ? (responseData as Record<string, unknown>).content as Record<string, unknown>[]
            : Array.isArray(responseData)
                ? responseData as Record<string, unknown>[]
                : [];

        const cleaned = items.filter((p) => {
            const raw = p.pdDel ?? p.pd_del ?? 0;
            const val = String(raw).trim().toLowerCase();
            return !(val === "1" || val === "true" || val === "y" || val === "yes");
        });

        return cleaned.map((p): Product => {
            const item = p as unknown as Product;
            return {
                ...item,
                id: (p.pdIdx ?? p.id ?? p.pd_idx) as number,
                title: (p.pdTitle ?? p.title ?? p.pd_title) as string,
                price: (p.pdPrice ?? p.price ?? p.pd_price) as number,
                thumbnail: (p.pdThumb ?? p.thumbnail ?? p.pd_thumb) as string,
                createdAt: (p.pdCreate ?? p.createdAt ?? p.pd_create) as string,
            };
        });
    } catch (error) {
        console.error(`[fetchSellerProducts] API Error:`, error);
        return [];
    }
}

export async function fetchProductDetail(productId: number | string): Promise<unknown> {
    if (!productId) return null;

    try {
        const data = await api(`/products/${productId}`, {
            cache: "no-store",
            headers: { Accept: "application/json" },
        } as never);
        return data;
    } catch (error) {
        console.error(`[fetchProductDetail] API Error for product ${productId}:`, error);
        return null;
    }
}
