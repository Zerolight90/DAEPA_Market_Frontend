import axios from "axios";
import tokenStore from "@/store/TokenStore";

// ✅ 환경 변수 대신 실제 API 주소를 직접 입력하여 불확실성을 제거합니다.
const api = axios.create({
  baseURL: "https://api.daepamarket.shop/api",
  withCredentials: true,
});

// 모든 요청에 액세스 토큰 자동 첨부 (기존 로직 유지)
api.interceptors.request.use(
  async (config) => {
    let accessToken;

    if (typeof window === "undefined") {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        accessToken = cookieStore.get("ACCESS_TOKEN")?.value;
      } catch (e) {
        // 서버 환경 에러 무시
      }
    } else {
      accessToken = tokenStore.getState().accessToken;
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

export default api;