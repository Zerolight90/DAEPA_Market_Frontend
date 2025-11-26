import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const tokenStore = create(
    persist(
        (set) => ({
            accessToken: null,
            setAccessToken: (token) => set({ accessToken: token }),
            clearAccessToken: () => set({ accessToken: null }),
        }),
        {
            name: "auth-storage", // localStorage에 저장될 때 사용될 키
            storage: createJSONStorage(() => localStorage), // localStorage를 사용
        }
    )
);

export default tokenStore;
