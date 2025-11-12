// src/lib/server/sellers.js
import "server-only";

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.API_BASE ||
    "http://localhost:8080";

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

    const url = new URL(`/api/sellers/${sellerId}/products`, API_BASE);
    url.search = qs.toString();

    const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
    });

    if (!res.ok) {
        return [];
    }

    const data = await res.json();
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
}

export async function fetchProductDetail(productId) {
    if (!productId) return null;

    const url = new URL(`/api/products/${productId}`, API_BASE);

    const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
    });

    if (!res.ok) return null;

    return res.json();
}
