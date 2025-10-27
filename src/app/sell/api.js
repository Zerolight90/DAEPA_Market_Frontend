// src/app/sell/api.js
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const API_PREFIX = "/api";

export const Endpoints = {
    // (기존) 카테고리/상품등록들...
    upperCategories: `${API_PREFIX}/category/uppers`,
    middleCategories: (upperId) => `${API_PREFIX}/category/uppers/${upperId}/middles`,
    lowCategories: (middleId)   => `${API_PREFIX}/category/middles/${middleId}/lows`,
    createProduct: `${API_PREFIX}/products/create-multipart`,

    // ✅ 여기 추가
    favoriteStatus: (pid) => `${API_PREFIX}/favorites/${pid}`,          // ✅ GET
    favoriteToggle: (pid) => `${API_PREFIX}/favorites/${pid}/toggle`,
};

// (선택) 공통 fetch 헬퍼 쓰면 쿠키 자동 포함
export async function apiFetch(path, opts = {}) {
    const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, { credentials: "include", ...opts });
    if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw new Error(`API ${res.status}: ${msg}`);
    }
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : null;
}
