// src/lib/server/categories.js
import { api } from "@/lib/api/client";

/** 상위카테고리 이름 → { id, name } */
export async function fetchUpperMeta(upperName) {
    try {
        // upperName이 아예 없으면 null 리턴해서 뒤에서 체크하게
        if (!upperName) return null;
        console.log(`[fetchUpperMeta] Searching for upper category: "${upperName}"`);

        // 1) by-name API가 있다면 우선 시도
        try {
            const endpoint = `/category/search?name=${encodeURIComponent(upperName)}`;
            console.log(`[fetchUpperMeta] Trying endpoint: ${endpoint}`);
            const response = await api.get(endpoint);
            const meta = response.data;
            console.log("[fetchUpperMeta] Response from by-name API:", meta);

            if (meta?.upperIdx || meta?.id) {
                const result = {
                    id: meta.upperIdx ?? meta.id,
                    name: meta.upperCt ?? meta.name ?? upperName,
                };
                console.log("[fetchUpperMeta] Found ID via by-name API:", result.id);
                return result;
            }
        } catch (e) {
            console.error("[fetchUpperMeta] by-name API failed:", e.message);
            // 못 받아도 밑으로 내려감
        }

        // 2) 전체 조회 후 매칭
        try {
            console.log("[fetchUpperMeta] Falling back to fetching all uppers.");
            const response = await api.get("/category/uppers");
            const list = response.data;
            console.log("[fetchUpperMeta] Response from all uppers API:", list);

            const found =
                Array.isArray(list) &&
                list.find(
                    (u) =>
                        (u.upperCt ?? u.name) === upperName ||
                        String(u.upperIdx ?? u.id) === String(upperName)
                );
            
            console.log("[fetchUpperMeta] Found object after searching list:", found);

            if (found) {
                const result = {
                    id: found.upperIdx ?? found.id,
                    name: found.upperCt ?? found.name ?? upperName,
                };
                console.log("[fetchUpperMeta] Found ID via all uppers list:", result.id);
                return result;
            }
        } catch (e) {
            console.error("[fetchUpperMeta] Fetching all uppers failed:", e.message);
            // 여기도 실패하면 마지막 fallback
        }

        // 3) 최후: 이름을 ID로 간주
        console.warn(`[fetchUpperMeta] No numeric ID found for "${upperName}". Falling back to using name as ID.`);
        return { id: upperName, name: upperName };
    } catch (error) {
        console.error(`[fetchUpperMeta] A critical error occurred for ${upperName}:`, error);
        return null;
    }
}

/** ✅ 전체 상위카테고리 목록 가져오기 */
export async function fetchUppers() {
    try {
        const response = await api.get("/category/uppers");
        const data = response.data;
        return (Array.isArray(data) ? data : []).map((u) => ({
            id: u.upperIdx ?? u.id,
            name: u.upperCt ?? u.name,
            // 메인에서 쓰는 것처럼 개수도 있으면 넘겨주기
            count: u.productCount ?? u.count ?? undefined,
        }));
    } catch (error) {
        console.error(`[fetchUppers] Failed:`, error);
        return [];
    }
}

/** 상위ID → 중간카테고리 목록 */
export async function fetchMiddles(upperId) {
    // 🛑 여기서 막는다: id 없으면 요청 안 함
    if (!upperId) return [];
    try {
        const response = await api.get(`/category/middle?upperCategory=${upperId}`);
        const data = response.data;
        return (Array.isArray(data) ? data : []).map((m) => ({
            id: m.middleIdx ?? m.id,
            name: m.middleCt ?? m.name,
            count: m.count ?? undefined,
        }));
    } catch (error) {
        console.error(`[fetchMiddles] Failed for upperId ${upperId}:`, error);
        return [];
    }
}

/** 중간ID → 하위카테고리 목록 */
export async function fetchLows(middleId) {
    // 🛑 여기도 막는다
    if (!middleId) return [];
    try {
        const response = await api.get(`/category/low?middleCategory=${middleId}`);
        const data = response.data;
        return (Array.isArray(data) ? data : []).map((l) => ({
            id: l.lowIdx ?? l.id,
            name: l.lowCt ?? l.name,
            count: l.count ?? undefined,
        }));
    } catch (error) {
        console.error(`[fetchLows] Failed for middleId ${middleId}:`, error);
        return [];
    }
}
