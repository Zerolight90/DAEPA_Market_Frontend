// src/store/SellerHintStore.js
import { create } from "zustand";

/**
 * 판매자 프로필 힌트 캐시
 * - hints[id] = { nickname, avatarUrl, freshness, deals, since }
 * - remember(): 기존 값과 병합(동일 key는 덮어씀)
 */
const useSellerHintStore = create((set) => ({
    hints: {},
    remember: (sellerId, hint) =>
        set((s) => {
            const key = String(sellerId);
            const prev = s.hints[key] || {};
            // 동일 레퍼런스를 유지하도록 필요 없을 때는 새 객체를 만들지 않음
            const next = { ...prev, ...hint };
            if (
                prev.nickname === next.nickname &&
                prev.avatarUrl === next.avatarUrl &&
                prev.freshness === next.freshness &&
                prev.deals === next.deals &&
                prev.since === next.since
            ) {
                return s; // 변화 없음 → 레퍼런스 유지
            }
            return { hints: { ...s.hints, [key]: next } };
        }),
    clear: () => set({ hints: {} }),
}));

export default useSellerHintStore;
