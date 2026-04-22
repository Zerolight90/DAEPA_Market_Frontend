// components/chat/ReportModal.js
"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from "@mui/material";

/**
 * 신고하기 모달
 * props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onSubmit: (payload) => Promise<void> | void
 *  - target: { id?: number|null, name: string, avatar?: string|null }
 *  - roomId: number
 */
export default function ReportModal({ open, onClose, onSubmit, target, roomId }) {
    const [reason, setReason] = useState("스팸/광고");
    const [detail, setDetail] = useState("");

    useEffect(() => {
        if (!open) {
            setReason("스팸/광고");
            setDetail("");
        }
    }, [open]);

    const handleSubmit = async () => {
        const payload = {
            roomId,
            targetId: target?.id ?? null,
            targetName: target?.name ?? "",
            reason,
            detail: detail.trim(),
        };
        try {
            await onSubmit?.(payload);
            onClose?.();
        } catch (e) {
            console.error("report submit failed", e);
            alert("신고 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>신고하기</DialogTitle>
            <DialogContent dividers>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <img
                        src={target?.avatar || "/images/profile_img/sangjun.jpg"}
                        alt=""
                        style={{ width: 44, height: 44, borderRadius: 999, objectFit: "cover" }}
                    />
                    <div style={{ fontWeight: 600 }}>{target?.name || "상대"}</div>
                </div>

                <TextField
                    select
                    label="신고 사유"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                >
                    {["스팸/광고", "욕설/비하", "사기 의심", "개인정보 요구", "기타"].map((r) => (
                        <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    label="상세 내용 (선택)"
                    placeholder="상세한 상황을 적어주세요."
                    multiline
                    minRows={4}
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>취소</Button>
                <Button variant="contained" onClick={handleSubmit}>신고 제출</Button>
            </DialogActions>
        </Dialog>
    );
}
