import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAuthStore = create(
    persist(
        (set) => ({
            isLoggedIn: false,
            login: () => set({ isLoggedIn: true }),
            logout: () => set({ isLoggedIn: false }),
        }),
        {
            name: "auth-status", // localStorage에 저장될 때 사용될 키
            storage: createJSONStorage(() => localStorage), // localStorage를 사용
        }
    )
);

export default useAuthStore;
