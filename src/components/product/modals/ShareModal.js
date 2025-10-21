"use client";

import BaseModal from "@/components/ui/modal/BaseModal";

export default function ShareModal({ id, close, url = "" }) {
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url || location.href);
            alert("링크가 복사되었습니다.");
            close();
        } catch { /* noop */ }
    };

    return (
        <BaseModal id={id} close={close} title="공유하기"
                   footer={<button onClick={copy} style={primaryBtn}>링크 복사</button>}
        >
            <p style={{ color: "#555" }}>이 상품의 링크를 복사해서 공유할 수 있어요.</p>
            <input
                readOnly
                defaultValue={url || (typeof window !== "undefined" ? location.href : "")}
                style={{ width: "100%", border: "1px solid #ddd", padding: 10, borderRadius: 6 }}
            />
        </BaseModal>
    );
}
const primaryBtn = { background: "#008c6e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer" };
