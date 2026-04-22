import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getSafeLocalStorage } from "@/lib/safeStorage";

interface TokenState {
    accessToken: string | null;
    setAccessToken: (token: string) => void;
    clearAccessToken: () => void;
}

const memoryStorage = {
    getItem: (): null => null,
    setItem: (): void => {},
    removeItem: (): void => {},
};

const tokenStore = create<TokenState>()(
    persist(
        (set) => ({
            accessToken: null,
            setAccessToken: (token: string) => set({ accessToken: token }),
            clearAccessToken: () => set({ accessToken: null }),
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => getSafeLocalStorage() || memoryStorage),
        }
    )
);

export default tokenStore;
