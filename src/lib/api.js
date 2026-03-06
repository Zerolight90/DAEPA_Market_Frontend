import axios from "axios";
import tokenStore from "@/store/TokenStore";

const api = axios.create({
  baseURL: "/api",  // ✅ 상대경로로 변경
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  }
});

// 모든 요청에 액세스 토큰 자동 첨부 로직
api.interceptors.request.use(
    async (config) => {
        let accessToken;

        if (typeof window === "undefined") {
            try {
                const { cookies } = await import("next/headers");
                const cookieStore = await cookies();
                accessToken = cookieStore.get("ACCESS_TOKEN")?.value;
            } catch (e) {
                // 서버 사이드 에러 무시
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