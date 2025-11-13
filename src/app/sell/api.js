// src/app/sell/api.js
// ▶ 권장: next.config.mjs에 /api 프록시 rewrites가 있다면 BASE는 빈 문자열로.
//    (없고 직접 백엔드로 붙을 거면 NEXT_PUBLIC_API_BASE를 "http://localhost:8080/api"처럼 넣으세요.)
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const API_PREFIX = "";  // ← Next rewrite를 쓰면 이 값 유지

// 안전한 URL 조립 (중복 슬래시 방지)
function join(base, path) {
    if (!base) return path;
    if (!path) return base;
    return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export const Endpoints = {
    // ✅ 상위 카테고리 + 상품 개수 포함된 버전
    upperCategoriesWithCount: `${API_PREFIX}/category/uppers-with-count`, // ← 이 줄 추가!

    // 카테고리/상품등록
    upperCategories: `${API_PREFIX}/category/uppers`,
    middleCategories: (upperId) => `${API_PREFIX}/category/uppers/${upperId}/middles`,
    lowCategories: (middleId)   => `${API_PREFIX}/category/middles/${middleId}/lows`,
    createProduct: `${API_PREFIX}/products/create-multipart`,

    // ✅ 찜 관련
    favoriteStatus: (pid) => `${API_PREFIX}/favorites/${pid}`,          // GET
    favoriteToggle: (pid) => `${API_PREFIX}/favorites/${pid}/toggle`,   // POST
};

// 공통 fetch 헬퍼 (쿠키 포함)
export async function apiFetch(path, opts = {}) {
    const url = join(API_BASE, path.startsWith("/") ? path : `/${path}`);
    const res = await fetch(url, { credentials: "include", ...opts });

    // JSON이면 json 파싱, 아니면 text/빈값
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (!res.ok) {
        const msg = isJson ? JSON.stringify(body) : (body || res.statusText);
        throw new Error(`API ${res.status}: ${msg}`);
    }
    return body ?? null;
}
