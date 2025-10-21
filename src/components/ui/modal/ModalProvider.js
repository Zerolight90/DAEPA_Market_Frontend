"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
    const [modals, setModals] = useState([]); // [{id, element}]
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const open = useCallback((element) => {
        const id = crypto.randomUUID();
        setModals((list) => [...list, { id, element }]);
        return id;
    }, []);
    const close = useCallback((id) => setModals((list) => list.filter((m) => m.id !== id)), []);
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
export function useModal() {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error("useModal must be used within ModalProvider");
    return ctx;
}
