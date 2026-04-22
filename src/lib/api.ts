import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import tokenStore from "@/store/TokenStore";

const isServer = typeof window === "undefined";
const baseURL = isServer
    ? (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080") + "/api"
    : "/api";

const api: AxiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// ─── Request Interceptor ──────────────────────────────────────────────────
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        let accessToken: string | undefined;

        if (typeof window === "undefined") {
            try {
                const { cookies } = await import("next/headers");
                const cookieStore = await cookies();
                accessToken = cookieStore.get("ACCESS_TOKEN")?.value;
            } catch {
                // SSR 환경에서는 무시
            }
        } else {
            accessToken = tokenStore.getState().accessToken ?? undefined;
        }

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const flushQueue = (newToken: string) => {
    pendingQueue.forEach(({ resolve }) => resolve(newToken));
    pendingQueue = [];
};

const rejectQueue = (error: unknown) => {
    pendingQueue.forEach(({ reject }) => reject(error));
    pendingQueue = [];
};

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalReq = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status !== 401 || originalReq._retry) {
            return Promise.reject(error);
        }

        if (originalReq.url?.includes("/sign/refresh")) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push({
                    resolve: (newToken: string) => {
                        if (originalReq.headers) {
                            (originalReq.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
                        }
                        originalReq._retry = true;
                        resolve(api(originalReq));
                    },
                    reject,
                });
            });
        }

        originalReq._retry = true;
        isRefreshing = true;

        try {
            const { data } = await api.post("/sign/refresh");
            const newToken: string | null = data?.accessToken || null;

            if (newToken) {
                tokenStore.getState().setAccessToken(newToken);
            }

            flushQueue(newToken || "");

            if (newToken && originalReq.headers) {
                (originalReq.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
            }
            return api(originalReq);
        } catch (refreshError) {
            rejectQueue(refreshError);

            if (typeof window !== "undefined") {
                tokenStore.getState().clearAccessToken();

                try {
                    const { default: useAuthStore } = await import("@/store/useAuthStore");
                    useAuthStore.getState().logout();
                } catch {
                    // 무시
                }

                const currentPath = window.location.pathname;
                if (!currentPath.includes("/sign/login") && !originalReq.url?.includes("/sign/me")) {
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
