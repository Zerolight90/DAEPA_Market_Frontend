process.env.NEXT_PUBLIC_API_BASE;
/** 내부: 절대/상대 경로 처리 + /api prefix 보장 */
function buildUrl(path) {
    if (!path) throw new Error("api(): path is required");
    if (/^https?:\/\//i.test(path)) return path;         // 절대 URL이면 그대로
    const clean = path.startsWith("/") ? path : `/${path}`;
    const withApi = clean.startsWith("/api/") ? clean : `/api${clean}`;
    return `${API_BASE}${withApi}`;                  // /api/...
}

/**
 * 공통 fetch (SSR/CSR)
 * - ISR 쓰려면 next 전달, 아니면 기본 no-store
 */
export async function api(
    path,
    { method = "GET", headers = {}, body, next, cache, credentials } = {}
) {
    const url = buildUrl(path);
    const init = { method, headers: { ...headers } };

    // GET이 아닌데 body가 있으면 처리
    const hasBody = body != null && method.toUpperCase() !== "GET";
    if (hasBody) {
        if (typeof FormData !== "undefined" && body instanceof FormData) {
            init.body = body; // Content-Type 자동
        } else {
            init.body = typeof body === "string" ? body : JSON.stringify(body);
            if (!init.headers["Content-Type"]) init.headers["Content-Type"] = "application/json";
        }
    }

    // 캐시 옵션 충돌 방지
    if (next) init.next = next; else init.cache = cache ?? "no-store";
    if (credentials) init.credentials = credentials;

    const res = await fetch(url, init);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API ${res.status} ${res.statusText} - ${text}`);
    }

    if (res.status === 204) return null;
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
}
