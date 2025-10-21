const BASE = process.env.NEXT_PUBLIC_API_BASE || "";

/**
 * 공통 fetch 래퍼 (SSR/CSR 모두 사용)
 * - 서버 컴포넌트에서: next 옵션으로 캐싱/리밸리데이트 제어
 * - 클라이언트 컴포넌트에서: 일반 fetch
 */
export async function api(path, { method = "GET", headers = {}, body, next } = {}) {
    const url = `${BASE}${path}`;
    const init = {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: body ? JSON.stringify(body) : undefined,
        // next 옵션은 서버에서만 사용됨(무시되어도 안전)
        next,
        cache: "no-store" // 기본은 최신; 페이지별로 next.revalidate 지정 가능
    };

    const res = await fetch(url, init);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API ${res.status} ${res.statusText} - ${text}`);
    }
    // 응답이 비어있을 수도 있으니 방어
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    return res.json();
}
