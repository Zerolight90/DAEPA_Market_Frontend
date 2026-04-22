import { api } from "@/lib/api/client";
import type { UpperCategory, MiddleCategory, LowCategory } from "@/types";

interface UpperMeta {
    id: number | null;
    name: string;
}

export async function fetchUpperMeta(upperName: string): Promise<UpperMeta | null> {
    if (!upperName) return null;

    const decoded = (() => {
        try { return decodeURIComponent(upperName); } catch { return upperName; }
    })();

    try {
        const response = await api.get<unknown[]>("/category/uppers");
        const list = Array.isArray(response.data) ? response.data : [];

        const found = list.find((u) => {
            const item = u as Record<string, unknown>;
            return (item.upperCt ?? item.name) === decoded ||
                String(item.upperIdx ?? item.id) === String(decoded);
        });

        if (found) {
            const item = found as Record<string, unknown>;
            return {
                id: (item.upperIdx ?? item.id) as number,
                name: (item.upperCt ?? item.name ?? decoded) as string,
            };
        }

        console.warn(`[fetchUpperMeta] Upper category "${upperName}" not found; falling back to name.`);
        return { id: null, name: decoded };
    } catch (error) {
        console.error("[fetchUpperMeta] Failed to load upper categories:", error);
        return { id: null, name: decoded };
    }
}

export async function fetchUppers(): Promise<UpperCategory[]> {
    try {
        const response = await api.get<unknown[]>("/category/uppers");
        const data = response.data;
        return (Array.isArray(data) ? data : []).map((u) => {
            const item = u as Record<string, unknown>;
            return {
                id: (item.upperIdx ?? item.id) as number,
                name: (item.upperCt ?? item.name) as string,
                count: (item.productCount ?? item.count) as number | undefined,
            };
        });
    } catch (error) {
        console.error("[fetchUppers] Failed:", error);
        return [];
    }
}

export async function fetchMiddles(upperId: number | string): Promise<MiddleCategory[]> {
    if (!upperId) return [];
    try {
        const response = await api.get<unknown[]>(`/category/uppers/${upperId}/middles`);
        const data = response.data;
        return (Array.isArray(data) ? data : []).map((m) => {
            const item = m as Record<string, unknown>;
            return {
                id: (item.middleIdx ?? item.id) as number,
                name: (item.middleCt ?? item.name) as string,
                count: item.count as number | undefined,
            };
        });
    } catch (error) {
        console.error(`[fetchMiddles] Failed for upperId ${upperId}:`, error);
        return [];
    }
}

export async function fetchLows(middleId: number | string): Promise<LowCategory[]> {
    if (!middleId) return [];
    try {
        const response = await api.get<unknown[]>(`/category/middles/${middleId}/lows`);
        const data = response.data;
        return (Array.isArray(data) ? data : []).map((l) => {
            const item = l as Record<string, unknown>;
            return {
                id: (item.lowIdx ?? item.id) as number,
                name: (item.lowCt ?? item.name) as string,
                count: item.count as number | undefined,
            };
        });
    } catch (error) {
        console.error(`[fetchLows] Failed for middleId ${middleId}:`, error);
        return [];
    }
}
