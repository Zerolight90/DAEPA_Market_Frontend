// src/lib/server/sellers.js
import "server-only";

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.API_BASE ||
    "http://localhost:8080";

/**
 * 판매자가 올린 상품 목록
 * 백엔드에 이미 있는: GET /api/sellers/{sellerId}/products
 */
export async function fetchSellerProducts({
                                              sellerId,
                                              page = 0,
                                              size = 20,
                                              sort = "recent",
                                              status, // 지금은 안 써도 일단 받아둠
                                          }) {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("size", String(size));
    // sort, status 는 네가 백엔드에서 아직 안 받으면 무시돼도 됨

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
    // 이 API 가 List<ProductCardDTO> 를 바로 주고 있으니까 그대로 반환
    return Array.isArray(data) ? data : [];
}

/**
 * 상품 하나 상세 가져오기
 * 백엔드에 이미 있는: GET /api/products/{id}
 */
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
