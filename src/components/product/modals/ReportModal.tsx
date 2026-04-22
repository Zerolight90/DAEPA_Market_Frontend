// src/components/product/modals/ReportModal.tsx
"use client";

import { useState, type CSSProperties } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";
import { api } from "@/lib/api/client";
// api 인터셉터가 토큰 첨부·갱신을 자동으로 처리 — tokenStore 직접 읽기 불필요

const STATUS_LABELS: Record<number, string> = {
    1: "사기 의심",
    2: "욕설/비방",
    3: "스팸/광고",
    4: "기타",
};

interface ReportModalProps {
    id: string;
    close: () => void;
    productId: number | string | null | undefined;
}

interface ReportPayload {
    productId: number;
    ngStatus: number;
    ngContent: string;
}

export default function ReportModal({ id, close, productId }: ReportModalProps) {
    const [status, setStatus] = useState<number>(1);
    const [detail, setDetail] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    const submit = async () => {
        if (!productId) return alert("상품 정보가 없습니다.");
        if (detail.length > 400) return alert("상세 내용은 최대 400자입니다.");

        try {
            setSubmitting(true);
            // api.post()를 사용해야 data 필드로 body가 올바르게 전송됩니다.
            // (fetch 스타일 body: JSON.stringify() 는 Axios에서 무시됩니다)
            const payload: ReportPayload = {
                productId: Number(productId),
                ngStatus: Number(status),
                ngContent: detail.trim(),
            };
            await api.post("/naga/report", payload);

            alert("신고가 접수되었습니다.");
            close();
        } catch (e: unknown) {
            console.error(e);
            const err = e as { response?: { data?: { message?: string } }; message?: string };
            const errorMessage =
                err.response?.data?.message || err.message || "신고 접수 중 오류가 발생했습니다.";
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <BaseModal
            id={id}
            close={close}
            title="신고하기"
            footer={
                <button onClick={submit} disabled={submitting} style={primaryBtn}>
                    {submitting ? "접수 중…" : "신고 접수"}
                </button>
            }
        >
            <label style={label}>사유 선택</label>
            <select
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                style={input}
            >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                        {v}
                    </option>
                ))}
            </select>

            <label style={label}>상세 내용 (최대 400자)</label>
            <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                style={{ ...input, height: 120 }}
                placeholder="상세 내용을 입력해 주세요."
                maxLength={400}
            />
        </BaseModal>
    );
}

const primaryBtn: CSSProperties = {
    background: "#008c6e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
};
const label: CSSProperties = {
    display: "block",
    margin: "10px 0 6px",
    color: "#555",
    fontSize: 13,
};
const input: CSSProperties = {
    width: "100%",
    border: "1px solid #ddd",
    padding: 10,
    borderRadius: 6,
};
