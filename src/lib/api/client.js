// const API_BASE = process.env.NEXT_PUBLIC_API_BASE; // No longer needed for client-side calls

/**
 * 환경 변수에서 API 기본 URL을 가져옵니다.
 * 정의되지 않은 경우, 설정의 중요성을 강조하며 에러를 발생시킵니다.
 */
export function getApiBaseUrl() {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE;
    if (!baseUrl) {
        throw new Error(
            "환경 변수 `NEXT_PUBLIC_API_BASE`가 설정되지 않았습니다. " +
            "API 요청을 위해 .env 파일에 해당 변수를 꼭 설정해주세요. " +
            "(예: `NEXT_PUBLIC_API_BASE=http://localhost:8080`)"
        );
    }
    return baseUrl;
}

/**
 * API 요청을 위한 전체 URL을 생성합니다.
 * @param {string} path - API 경로 (예: "/users/1")
 * @returns {string} - 전체 URL (예: "http://localhost:8080/api/users/1")
 */
function buildUrl(path) {
    if (!path) throw new Error("api(path, ...) 'path'는 필수입니다.");
    if (/^https?:\/\//i.test(path)) return path; // 절대 URL이면 그대로 반환

    const baseUrl = getApiBaseUrl();
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const withApi = cleanPath.startsWith("/api/") ? cleanPath : `/api${cleanPath}`;
    
    // URL 생성자를 사용하여 안전하게 결합
    return new URL(withApi, baseUrl).toString();
}

/**
 * 공통 fetch 함수 (SSR/CSR 양용)
 * - 서버/클라이언트 모두 NEXT_PUBLIC_API_BASE를 사용하여 절대 경로로 요청합니다.
 * - ISR을 사용하려면 `next` 옵션을, 그 외에는 기본적으로 `no-store` 캐시를 사용합니다.
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
        const errorBody = await res.text().catch(() => "");
        const error = new Error(
            `API Error ${res.status} ${res.statusText}: ${errorBody}`
        );
        error.status = res.status; // status 코드를 에러 객체에 추가
        try {
            error.data = JSON.parse(errorBody); // JSON 파싱 시도
        } catch {
            error.data = errorBody; // 실패 시 텍스트 그대로 저장
        }
        throw error;
    }

    if (res.status === 204) return null;
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
}
