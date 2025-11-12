'use client';

import { create } from 'zustand';

/**
 * 최근 본 판매자 프로필을 임시 저장하는 초경량 캐시.
 * - key: sellerId(string)
 * - value: { nickname, avatarUrl, freshness, deals?, since? }
 */
const useSellerHintStore = create((set, get) => ({
    map: {},

    remember(id, data) {
        if (!id) return;
        set((s) => ({ map: { ...s.map, [String(id)]: { ...data } } }));
    },

    getHint(id) {
        return id ? get().map[String(id)] : undefined;
    },

    clear(id) {
        if (!id) return;
        set((s) => {
            const m = { ...s.map };
            delete m[String(id)];
            return { map: m };
        });
    },
}));

export default useSellerHintStore;
