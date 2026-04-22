"use client";

import { useEffect } from "react";

const noopStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
};

/**
 * 브라우저가 localStorage/sessionStorage 접근을 막을 때
 * DOMException을 삼키고 no-op 스토리지로 대체한다.
 */
export default function StorageGuard() {
    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            // 접근만 시도하고, setItem은 호출하지 않는다 (차단 환경에서 예외 방지)
            try { window.localStorage?.getItem?.("__probe__"); } catch (e) {
                Object.defineProperty(window, "localStorage", { value: noopStorage, configurable: true });
            }
            try { window.sessionStorage?.getItem?.("__probe__"); } catch (e) {
                Object.defineProperty(window, "sessionStorage", { value: noopStorage, configurable: true });
            }
        } catch (e) {
            try {
                // storage 접근이 막혔으면 no-op 객체로 덮어써서 이후 호출이 터지지 않게 한다.
                Object.defineProperty(window, "localStorage", {
                    value: noopStorage,
                    configurable: true,
                });
                Object.defineProperty(window, "sessionStorage", {
                    value: noopStorage,
                    configurable: true,
                });
            } catch {
                // 정의 실패 시에도 조용히 무시
            }
        }
    }, []);

    return null;
}
