const noopStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    get length() {
        return 0;
    },
};

function probeStorage(storage) {
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

export function getSafeLocalStorage() {
    try {
        if (typeof window === "undefined") return noopStorage;
        if (probeStorage(window.localStorage)) return window.localStorage;
    } catch {}
    return noopStorage;
}

export function getSafeSessionStorage() {
    try {
        if (typeof window === "undefined") return noopStorage;
        if (probeStorage(window.sessionStorage)) return window.sessionStorage;
    } catch {}
    return noopStorage;
}

export function safeGetItem(storage, key, fallback = null) {
    try {
        const v = storage.getItem(key);
        return v === null || v === undefined ? fallback : v;
    } catch {
        return fallback;
    }
}

export function safeSetItem(storage, key, value) {
    try {
        storage.setItem(key, value);
    } catch {
        // ignore
    }
}

export function safeRemoveItem(storage, key) {
    try {
        storage.removeItem(key);
    } catch {
        // ignore
    }
}
