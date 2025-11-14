import { create } from "zustand";
import { persist } from "zustand/middleware";

const useTokenStore = create(
    persist(
        (set) => ({
            accessToken: null,
            setToken: (token) => set({ accessToken: token }),
            clearToken: () => set({ accessToken: null }),
        }),
        {
            name: "token-storage", // 로컬 스토리지에 저장될 때 사용될 키 이름
            getStorage: () => localStorage, // 사용할 스토리지 지정
        }
    )
);

export default useTokenStore;
