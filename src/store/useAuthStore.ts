import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getSafeLocalStorage } from "@/lib/safeStorage";
import type { User } from "@/types";

interface AuthState {
    isLoggedIn: boolean;
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
}

const memoryStorage = {
    getItem: (): null => null,
    setItem: (): void => {},
    removeItem: (): void => {},
};

const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isLoggedIn: false,
            user: null,
            login: (userData: User) => set({ isLoggedIn: true, user: userData }),
            logout: () => set({ isLoggedIn: false, user: null }),
        }),
        {
            name: "auth-status",
            storage: createJSONStorage(() => getSafeLocalStorage() || memoryStorage),
        }
    )
);

export default useAuthStore;
