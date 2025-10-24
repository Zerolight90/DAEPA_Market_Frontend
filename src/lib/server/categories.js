// src/lib/server/categories.js
const BASE = process.env.NEXT_PUBLIC_API_BASE || "";

async function j(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Request failed ${res.status} for ${url}`);
    return res.json();
}

/** 상위카테고리 이름 → { id, name } */
export async function fetchUpperMeta(upperName) {
    // 1) by-name API가 있다면 우선 시도
    try {
        const meta = await j(`${BASE}/api/category/uppers/by-name?name=${encodeURIComponent(upperName)}`);
        if (meta?.upperIdx || meta?.id) {
            return { id: meta.upperIdx ?? meta.id, name: meta.upperCt ?? meta.name ?? upperName };
        }
    } catch (_) {}

    // 2) 전체 조회 후 매칭
    try {
        const list = await j(`${BASE}/api/category/uppers`);
        const found = Array.isArray(list) && list.find(
            (u) =>
                (u.upperCt ?? u.name) === upperName ||
                String(u.upperIdx ?? u.id) === String(upperName)
        );
        if (found) {
            return { id: found.upperIdx ?? found.id, name: found.upperCt ?? found.name ?? upperName };
        }
    } catch (_) {}

    // 3) 최후: 이름을 ID로 간주
    return { id: upperName, name: upperName };
}

/** 상위ID → 중간카테고리 목록 */
export async function fetchMiddles(upperId) {
    const data = await j(`${BASE}/api/category/uppers/${upperId}/middles`);
    return (Array.isArray(data) ? data : []).map((m) => ({
        id: m.middleIdx ?? m.id,
        name: m.middleCt ?? m.name,
        count: m.count ?? undefined,
    }));
}

/** 중간ID → 하위카테고리 목록 */
export async function fetchLows(middleId) {
    const data = await j(`${BASE}/api/category/middles/${middleId}/lows`);
    return (Array.isArray(data) ? data : []).map((l) => ({
        id: l.lowIdx ?? l.id,
        name: l.lowCt ?? l.name,
        count: l.count ?? undefined,
    }));
}
