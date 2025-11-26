import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAuthStore = create(
    persist(
        (set) => ({
            isLoggedIn: false,
            user: null, // 사용자 정보 추가
            login: (userData) => set({ isLoggedIn: true, user: userData }), // userData 받도록 수정
            logout: () => set({ isLoggedIn: false, user: null }), // user 정보도 초기화
        }),
        {
            name: "auth-status", // localStorage에 저장될 때 사용될 키
            storage: createJSONStorage(() => localStorage), // localStorage를 사용
        }
    )
);

export default useAuthStore;
