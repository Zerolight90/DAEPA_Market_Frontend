// src/lib/server/categories.js
import { api } from "@/lib/api/client";

/** 상위카테고리 이름 → { id, name } */
export async function fetchUpperMeta(upperName) {
    // upperName이 아예 없으면 null 리턴해서 뒤에서 체크하게
    if (!upperName) return null;

    // 1) by-name API가 있다면 우선 시도
    try {
        const meta = await api(
            `/category/uppers/by-name?name=${encodeURIComponent(upperName)}`
        );
        if (meta?.upperIdx || meta?.id) {
            return {
                id: meta.upperIdx ?? meta.id,
                name: meta.upperCt ?? meta.name ?? upperName,
            };
        }
    } catch (_) {
        // 못 받아도 밑으로 내려감
    }

    // 2) 전체 조회 후 매칭
    try {
        const list = await api("/category/uppers");
        const found =
            Array.isArray(list) &&
            list.find(
                (u) =>
                    (u.upperCt ?? u.name) === upperName ||
                    String(u.upperIdx ?? u.id) === String(upperName)
            );
        if (found) {
            return {
                id: found.upperIdx ?? found.id,
                name: found.upperCt ?? found.name ?? upperName,
            };
        }
    } catch (_) {
        // 여기도 실패하면 마지막 fallback
    }

    // 3) 최후: 이름을 ID로 간주
    return { id: upperName, name: upperName };
}

/** ✅ 전체 상위카테고리 목록 가져오기 */
export async function fetchUppers() {
    const data = await api("/category/uppers");
    return (Array.isArray(data) ? data : []).map((u) => ({
        id: u.upperIdx ?? u.id,
        name: u.upperCt ?? u.name,
        // 메인에서 쓰는 것처럼 개수도 있으면 넘겨주기
        count: u.productCount ?? u.count ?? undefined,
    }));
}

/** 상위ID → 중간카테고리 목록 */
export async function fetchMiddles(upperId) {
    // 🛑 여기서 막는다: id 없으면 요청 안 함
    if (!upperId) return [];
    const data = await api(`/category/uppers/${upperId}/middles`);
    return (Array.isArray(data) ? data : []).map((m) => ({
        id: m.middleIdx ?? m.id,
        name: m.middleCt ?? m.name,
        count: m.count ?? undefined,
    }));
}

/** 중간ID → 하위카테고리 목록 */
export async function fetchLows(middleId) {
    // 🛑 여기도 막는다
    if (!middleId) return [];
    const data = await api(`/category/middles/${middleId}/lows`);
    return (Array.isArray(data) ? data : []).map((l) => ({
        id: l.lowIdx ?? l.id,
        name: l.lowCt ?? l.name,
        count: l.count ?? undefined,
    }));
}
