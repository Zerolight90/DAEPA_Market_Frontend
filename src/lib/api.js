import axios from "axios";
import tokenStore from "@/store/TokenStore";

// 중앙 axios 인스턴스
const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_BASE}/api`,
  withCredentials: true,
});

// 모든 요청에 액세스 토큰 자동 첨부
api.interceptors.request.use(
  async (config) => {
    let accessToken;

    // 서버 환경 (app router server component)
    if (typeof window === "undefined") {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        accessToken = cookieStore.get("ACCESS_TOKEN")?.value;
      } catch (e) {
        // 서버가 아닌 환경이면 무시
      }
    } else {
      // 클라이언트 환경
      accessToken = tokenStore.getState().accessToken;
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
