import axios from "axios";
import tokenStore from "@/store/TokenStore";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // HttpOnly 쿠키 자동 전송 (REFRESH_TOKEN)
  headers: {
    "Content-Type": "application/json",
  },
});

// ─────────────────────────────────────────────
// Request Interceptor: 모든 요청에 Access Token 자동 첨부
// ─────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    let accessToken;

    if (typeof window === "undefined") {
      // 서버 사이드 렌더링
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        accessToken = cookieStore.get("ACCESS_TOKEN")?.value;
      } catch (e) {
        // SSR 환경에서는 무시
      }
    } else {
      // 클라이언트 사이드: Zustand Store 우선
      accessToken = tokenStore.getState().accessToken;

      // Store에 없으면 쿠키에서 읽기 (새로고침 직후 등)
      if (!accessToken && typeof document !== "undefined") {
        const m = document.cookie.match(/(?:^|; )ACCESS_TOKEN=([^;]*)/);
        if (m && m[1]) {
          try {
            accessToken = decodeURIComponent(m[1]);
          } catch {
            accessToken = m[1];
          }
        }
      }
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// Response Interceptor: 401 감지 → Token Refresh → 재시도
// Race Condition 방지: isRefreshing 플래그 + pendingQueue 패턴
// ─────────────────────────────────────────────
let isRefreshing = false;
let pendingQueue = []; // { resolve, reject }[]

/** refresh 완료 후 대기 중이던 요청 일괄 처리 */
const flushQueue = (newToken) => {
  pendingQueue.forEach(({ resolve }) => resolve(newToken));
  pendingQueue = [];
};

/** refresh 실패 시 대기 중이던 요청 일괄 거부 */
const rejectQueue = (error) => {
  pendingQueue.forEach(({ reject }) => reject(error));
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response, // 성공 응답은 그대로 통과

  async (error) => {
    const originalReq = error.config;

    // 401이 아니거나, 이미 재시도한 요청이면 바로 reject
    if (error.response?.status !== 401 || originalReq._retry) {
      return Promise.reject(error);
    }

    // refresh 엔드포인트 자체가 401이면 무한루프 방지
    if (originalReq.url?.includes("/sing/refresh")) {
      return Promise.reject(error);
    }

    // ── 이미 다른 요청이 refresh 중이면 큐에 대기 ──
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken) => {
            originalReq.headers.Authorization = `Bearer ${newToken}`;
            originalReq._retry = true;
            resolve(api(originalReq));
          },
          reject,
        });
      });
    }

    // ── 최초 401: refresh 시도 ──
    originalReq._retry = true;
    isRefreshing = true;

    try {
      // REFRESH_TOKEN은 HttpOnly Cookie로 자동 전송됨 (withCredentials: true)
      const { data } = await api.post("/sing/refresh");

      // 백엔드가 새 ACCESS_TOKEN을 쿠키로 내려주지만,
      // Zustand Store도 최신 상태로 유지 (쿠키에서 읽어서 저장)
      const newToken = extractAccessTokenFromCookie();
      if (newToken) {
        tokenStore.getState().setAccessToken(newToken);
      }

      // 대기 중이던 모든 요청 재실행
      flushQueue(newToken || "");

      // 원래 요청 재시도
      if (newToken) {
        originalReq.headers.Authorization = `Bearer ${newToken}`;
      }
      return api(originalReq);

    } catch (refreshError) {
      // refresh도 실패 → 완전 로그아웃 처리
      rejectQueue(refreshError);

      // 클라이언트 사이드에서만 실행
      if (typeof window !== "undefined") {
        tokenStore.getState().clearAccessToken();

        // useAuthStore 초기화 (동적 import로 순환 참조 방지)
        try {
          const { default: useAuthStore } = await import("@/store/useAuthStore");
          useAuthStore.getState().logout();
        } catch (e) {
          // 무시
        }

        // 로그인 페이지로 이동 (세션 만료 안내)
        const currentPath = window.location.pathname + window.location.search;
        const loginUrl = `/sing/login?reason=session_expired&next=${encodeURIComponent(currentPath)}`;
        window.location.href = loginUrl;
      }

      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);

/** document.cookie에서 ACCESS_TOKEN 파싱 */
function extractAccessTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )ACCESS_TOKEN=([^;]*)/);
  if (!m || !m[1]) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

export default api;
