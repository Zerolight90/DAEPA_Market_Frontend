import { create } from "zustand";
import type { SellerHint } from "@/types";

interface SellerHintState {
    hints: Record<string, SellerHint>;
    remember: (sellerId: number | string, hint: SellerHint) => void;
    clear: () => void;
}

const useSellerHintStore = create<SellerHintState>((set) => ({
    hints: {},
    remember: (sellerId: number | string, hint: SellerHint) =>
        set((s) => {
            const key = String(sellerId);
            const prev = s.hints[key] || {};
            const next: SellerHint = { ...prev, ...hint };
            if (
                prev.nickname === next.nickname &&
                prev.avatarUrl === next.avatarUrl &&
                prev.freshness === next.freshness &&
                prev.deals === next.deals &&
                prev.since === next.since
            ) {
                return s;
            }
            return { hints: { ...s.hints, [key]: next } };
        }),
    clear: () => set({ hints: {} }),
}));

export default useSellerHintStore;
