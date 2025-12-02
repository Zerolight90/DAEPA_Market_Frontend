import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getSafeLocalStorage } from "@/lib/safeStorage";

const memoryStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
};

const tokenStore = create(
    persist(
        (set) => ({
            accessToken: null,
            setAccessToken: (token) => set({ accessToken: token }),
            clearAccessToken: () => set({ accessToken: null }),
        }),
        {
            name: "auth-storage", // localStorage에 저장될 키 이름입니다.
            storage: createJSONStorage(() => getSafeLocalStorage() || memoryStorage), // localStorage를 사용
        }
    )
);

export default tokenStore;
