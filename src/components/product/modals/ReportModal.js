"use client";

import { useState } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";

export default function ReportModal({ id, close, itemId }) {
    const [reason, setReason] = useState("사기 의심");
    const [detail, setDetail] = useState("");

    const submit = () => {
        // TODO: 실제 API POST 연결
        console.log("REPORT", { itemId, reason, detail });
        alert("신고가 접수되었습니다.");
        close();
    };

    return (
        <BaseModal id={id} close={close} title="신고하기"
                   footer={<button onClick={submit} style={primaryBtn}>신고 접수</button>}
        >
            <label style={label}>사유 선택</label>
            <select value={reason} onChange={(e)=>setReason(e.target.value)} style={input}>
                <option>사기 의심</option>
                <option>허위/과장 광고</option>
                <option>불법/금지 품목</option>
                <option>기타</option>
            </select>
            <label style={label}>상세 내용</label>
            <textarea value={detail} onChange={(e)=>setDetail(e.target.value)} style={{...input, height:120}} placeholder="상세 내용을 입력해 주세요." />
        </BaseModal>
    );
}
const primaryBtn = { background: "#008c6e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer" };
const label = { display: "block", margin: "10px 0 6px", color: "#555", fontSize: 13 };
const input = { width: "100%", border: "1px solid #ddd", padding: 10, borderRadius: 6 };
