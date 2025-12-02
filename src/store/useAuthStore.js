import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getSafeLocalStorage } from "@/lib/safeStorage";

const memoryStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
};

const useAuthStore = create(
    persist(
        (set) => ({
            isLoggedIn: false,
            user: null, // 사용자 정보 추가
            login: (userData) => set({ isLoggedIn: true, user: userData }), // userData 받도록 수정
            logout: () => set({ isLoggedIn: false, user: null }), // user 정보도 초기화
        }),
        {
            name: "auth-status", // localStorage에 저장될 키 이름입니다.
            storage: createJSONStorage(() => getSafeLocalStorage() || memoryStorage), // localStorage를 사용
        }
    )
);

export default useAuthStore;
