// 환경변수(NEXT_PUBLIC_API_BASE)는 예: http://localhost:8080
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

const API_PREFIX = "/api";

export const Endpoints = {
    // 카테고리
    upperCategories: `${API_PREFIX}/category/uppers`,
    middleCategories: (upperId) => `${API_PREFIX}/category/uppers/${upperId}/middles`,
    lowCategories: (middleId)   => `${API_PREFIX}/category/middles/${middleId}/lows`,

    // ✅ 상품 등록(멀티파트)
    createProduct: `${API_PREFIX}/products/create-multipart`,
};

export async function apiFetch(path, opts = {}) {
    const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, opts);
    if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw new Error(`API ${res.status}: ${msg}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return null;
}
