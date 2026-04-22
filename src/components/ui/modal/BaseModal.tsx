"use client";

import type { ReactNode, CSSProperties } from "react";

interface BaseModalProps {
    id?: string;
    close: () => void;
    title?: string;
    children?: ReactNode;
    footer?: ReactNode;
}

export default function BaseModal({ id, close, title, children, footer }: BaseModalProps) {
    return (
        <div style={overlay} onClick={close}>
            <div style={wrap} onClick={(e) => e.stopPropagation()}>
                <div style={head}>
                    <strong>{title}</strong>
                    <button onClick={close} style={xbtn}>×</button>
                </div>
                <div style={body}>{children}</div>
                {footer && <div style={foot}>{footer}</div>}
            </div>
        </div>
    );
}

const overlay: CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 1000 };
const wrap: CSSProperties = { width: 520, maxWidth: "92vw", background: "#fff", borderRadius: 12, overflow: "hidden" };
const head: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #eee" };
const xbtn: CSSProperties = { border: "none", background: "transparent", fontSize: 22, lineHeight: 1, cursor: "pointer" };
const body: CSSProperties = { padding: 16 };
const foot: CSSProperties = { padding: 12, borderTop: "1px solid #eee" };
