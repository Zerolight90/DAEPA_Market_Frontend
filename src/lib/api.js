import axios from "axios";
import tokenStore from "@/store/TokenStore";

const isServer = typeof window === "undefined";
// 서버(SSR)일 때는 환경변수 주소를 붙이고, 클라이언트(브라우저)일 때는 상대 경로(/api) 사용
const baseURL = isServer 
    ? (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080") + "/api" 
    : "/api";

const api = axios.create({
  baseURL: baseURL, // 🚨 수정된 부분
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
      // 클라이언트 사이드: Zustand Store에서 읽기
      // ACCESS_TOKEN은 HttpOnly 쿠키로 저장되므로 JS로 직접 읽을 수 없음
      // 로그인/refresh 시 응답 바디에서 받아 Store에 저장한 값을 사용
      accessToken = tokenStore.getState().accessToken;
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
    if (originalReq.url?.includes("/sign/refresh")) {
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
      // 백엔드가 응답 바디에 accessToken을 포함해 반환함
      const { data } = await api.post("/sign/refresh");

      // 응답 바디에서 accessToken 읽기 (HttpOnly 쿠키는 JS로 읽을 수 없음)
      const newToken = data?.accessToken || null;
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

        const currentPath = window.location.pathname;
        
        // 🚨 방어막 추가: 현재 주소가 로그인 페이지가 아니고, 요청한 API가 '/sign/me'가 아닐 때만 튕겨냅니다!
        if (!currentPath.includes('/sign/login') && !originalReq.url?.includes('/sign/me')) {
          const fullPath = currentPath + window.location.search;
          window.location.href = `/sign/login?reason=session_expired&next=${encodeURIComponent(fullPath)}`;
        }
      }

      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);

export default api;