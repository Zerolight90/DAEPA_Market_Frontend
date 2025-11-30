// src/lib/server/categories.js
import { api } from "@/lib/api/client";

// Upper category metadata by display name or id in the URL
export async function fetchUpperMeta(upperName) {
    if (!upperName) return null;

    const decoded = (() => {
        try {
            return decodeURIComponent(upperName);
        } catch (e) {
            return upperName;
        }
    })();

    try {
        const response = await api.get("/category/uppers");
        const list = Array.isArray(response.data) ? response.data : [];

        const found =
            list.find(
                (u) =>
                    (u.upperCt ?? u.name) === decoded ||
                    String(u.upperIdx ?? u.id) === String(decoded)
            ) ?? null;

        if (found) {
            return {
                id: found.upperIdx ?? found.id,
                name: found.upperCt ?? found.name ?? decoded,
            };
        }

        console.warn(
            `[fetchUpperMeta] Upper category "${upperName}" not found; falling back to name.`
        );
        return { id: null, name: decoded };
    } catch (error) {
        console.error("[fetchUpperMeta] Failed to load upper categories:", error);
        return { id: null, name: decoded };
    }
}

// All upper categories
export async function fetchUppers() {
    try {
        const response = await api.get("/category/uppers");
        const data = response.data;
        return (Array.isArray(data) ? data : []).map((u) => ({
            id: u.upperIdx ?? u.id,
            name: u.upperCt ?? u.name,
            count: u.productCount ?? u.count ?? undefined,
        }));
    } catch (error) {
        console.error("[fetchUppers] Failed:", error);
        return [];
    }
}

// Middle categories by upper id
export async function fetchMiddles(upperId) {
    if (!upperId) return [];
    try {
        const response = await api.get(`/category/uppers/${upperId}/middles`);
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

// Low categories by middle id
export async function fetchLows(middleId) {
    if (!middleId) return [];
    try {
        const response = await api.get(`/category/middles/${middleId}/lows`);
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
