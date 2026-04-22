"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface ModalEntry {
    id: string;
    element: (props: { id: string; close: () => void }) => ReactNode;
}

interface ModalContextValue {
    open: (element: (props: { id: string; close: () => void }) => ReactNode) => string;
    close: (id: string) => void;
    closeAll: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

function generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function ModalProvider({ children }: { children: ReactNode }) {
    const [modals, setModals] = useState<ModalEntry[]>([]);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const open = useCallback((element: ModalEntry["element"]): string => {
        const id = generateUUID();
        setModals((list) => [...list, { id, element }]);
        return id;
    }, []);

    const close = useCallback((id: string) => {
        setModals((list) => list.filter((m) => m.id !== id));
    }, []);

    const closeAll = useCallback(() => setModals([]), []);

    return (
        <ModalContext.Provider value={{ open, close, closeAll }}>
            {children}
            {mounted
                ? createPortal(
                    <div>
                        {modals.map(({ id, element }) => (
                            <div key={id}>{element({ id, close: () => close(id) })}</div>
                        ))}
                    </div>,
                    document.body
                )
                : null}
        </ModalContext.Provider>
    );
}

export function useModal(): ModalContextValue {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error("useModal must be used within ModalProvider");
    return ctx;
}
