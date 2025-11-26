import tokenStore from "@/store/TokenStore";

export function getApiBaseUrl() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
        console.warn("NEXT_PUBLIC_API_URL is not defined in .env file.");
        return "http://localhost:8080"; // 기본값 제공
    }
    return baseUrl;
}

export async function api(endpoint, options = {}) {
    const fullUrl = `${getApiBaseUrl()}${endpoint}`;
    const { accessToken } = tokenStore.getState();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(fullUrl, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        const error = new Error(
            `API Error: ${response.status} ${response.statusText} - ${errorBody}`
        );
        error.status = response.status;
        throw error;
    }

    // 내용이 없는 응답(204 No Content 등)을 처리
    if (response.headers.get("content-length") === "0" || response.status === 204) {
        return null;
    }

    return response.json();
}
