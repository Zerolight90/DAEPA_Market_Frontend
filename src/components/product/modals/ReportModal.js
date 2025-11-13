// src/components/product/modals/ReportModal.js
"use client";

import { useState } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";
import tokenStore from "@/app/store/TokenStore"; // ✅ 토큰 스토어
import { api } from "@/lib/api/client";

const STATUS_LABELS = {
    1: "사기 의심",
    2: "욕설/비방",
    3: "스팸/광고",
    4: "기타",
};

// (옵션) 혹시 스토어가 비어있을 때 쿠키에서 꺼내는 보조 함수
function getCookie(name) {
    if (typeof document === "undefined") return "";
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : "";
}

export default function ReportModal({ id, close, productId }) {
    const [status, setStatus] = useState(1);
    const [detail, setDetail] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // ✅ 우선 스토어에서, 없으면 쿠키에서
    const { accessToken } = tokenStore.getState() || {};
    const bearer =
        accessToken?.trim() ||
        getCookie("accessToken") ||      // 프로젝트 쿠키 이름에 맞게
        getCookie("ACCESS_TOKEN") ||     // 예비
        "";

    const submit = async () => {
        if (!productId) return alert("상품 정보가 없습니다.");
        if (detail.length > 400) return alert("상세 내용은 최대 400자입니다.");

        if (!bearer) {
            alert("로그인 후 이용해주세요.");
            // 필요하면 로그인 페이지로 이동: location.href = `/sing/login?next=${encodeURIComponent(location.pathname+location.search)}`
            return;
        }

        try {
            setSubmitting(true);
            await api("/naga/report", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    // ✅ Authorization 헤더 추가
                    Authorization: `Bearer ${bearer}`,
                },
                body: JSON.stringify({
                    productId: Number(productId),
                    ngStatus: Number(status),
                    ngContent: detail.trim(),
                }),
            });

            alert("신고가 접수되었습니다.");
            close();
        } catch (e) {
            console.error(e);
            const errorMessage = e.data?.message || e.message || "신고 접수 중 오류가 발생했습니다.";
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

const primaryBtn = {
    background: "#008c6e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
};
const label = {
    display: "block",
    margin: "10px 0 6px",
    color: "#555",
    fontSize: 13,
};
const input = {
    width: "100%",
    border: "1px solid #ddd",
    padding: 10,
    borderRadius: 6,
};
