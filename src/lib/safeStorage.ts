const noopStorage: Storage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
};

function probeStorage(storage: Storage | null | undefined): boolean {
    if (!storage) return false;
    try {
        const k = "__storage_probe__";
        storage.setItem?.(k, "1");
        storage.removeItem?.(k);
        return true;
    } catch {
        return false;
    }
}

export function getSafeLocalStorage(): Storage {
    try {
        if (typeof window === "undefined") return noopStorage;
        if (probeStorage(window.localStorage)) return window.localStorage;
    } catch {}
    return noopStorage;
}

export function getSafeSessionStorage(): Storage {
    try {
        if (typeof window === "undefined") return noopStorage;
        if (probeStorage(window.sessionStorage)) return window.sessionStorage;
    } catch {}
    return noopStorage;
}

export function safeGetItem(storage: Storage, key: string, fallback: string | null = null): string | null {
    try {
        const v = storage.getItem(key);
        return v === null || v === undefined ? fallback : v;
    } catch {
        return fallback;
    }
}

export function safeSetItem(storage: Storage, key: string, value: string): void {
    try {
        storage.setItem(key, value);
    } catch {
        // ignore
    }
}

export function safeRemoveItem(storage: Storage, key: string): void {
    try {
        storage.removeItem(key);
    } catch {
        // ignore
    }
}
