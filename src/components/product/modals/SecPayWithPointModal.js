"use client";

import { useState, useEffect } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";
import { api } from "@/lib/api/client";

// PayWithPointModal과 동일한 구조·스타일, 안심결제 전용
export default function SecPayWithPointModal({ id, close, itemId, title, qty, total, productImageUrl }) {
    const [currentBalance, setCurrentBalance] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/pay/balance");
                setCurrentBalance(res.data?.balance ?? res.data ?? 0);
            } catch (err) {
                console.error("잔액 조회 오류:", err);
                setError(err.message);
                setCurrentBalance(0);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const handlePayWithPoints = async () => {
        if (isLoading) return;

        if (currentBalance === null || currentBalance < total) {
            alert("포인트 잔액이 부족합니다. 충전 후 이용해주세요.");
            return;
        }

        if (!confirm(`${total.toLocaleString()} P를 사용하여 결제하시겠습니까?\n(현재 잔액: ${currentBalance.toLocaleString()} P)`)) {
            return;
        }

        try {
            const res = await api.post("/pay/purchase-with-points", {
                itemId,
                qty,
                amount: total,
            });
            alert(`결제가 완료되었습니다.\n남은 잔액: ${res.data?.remainingBalance?.toLocaleString() || '?'} P`);
            close();
        } catch (err) {
            console.error("포인트 결제 오류:", err);
            alert(`오류: ${err.data?.error || err.message || '포인트 결제 중 오류 발생'}`);
        }
    };

    const primaryBtn = {
        width: "100%",
        padding: "12px 14px",
        background: "#008c6e",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontWeight: 700,
        fontSize: 15,
        cursor: "pointer",
        marginBottom: 10,
    };
    const ghostBtn = {
        width: "100%",
        padding: "11px 14px",
        background: "#fff",
        color: "#333",
        border: "1px solid #ddd",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
    };

    return (
        <BaseModal id={id} close={close} title="포인트 결제 (안심)">
            {/* 상품 이미지 + 제목 */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                {productImageUrl && (
                    <img
                        src={productImageUrl}
                        alt="상품 이미지"
                        style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                    />
                )}
                <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
            </div>

            {/* 수량 */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: "#555" }}>수량: {qty}</span>
            </div>

            {/* 결제금액 */}
            <div style={{ marginBottom: 20, fontSize: 14, color: error ? 'red' : '#555', fontWeight: 700 }}>
                결제금액: {total?.toLocaleString()} P
            </div>

            {/* 잔액 */}
            <div style={{ marginBottom: 20, fontSize: 14, color: error ? 'red' : '#555', fontWeight: 700 }}>
                {isLoading ? "잔액 조회 중.." :
                    error ? `오류: ${error}` :
                        currentBalance !== null
                            ? `현재 잔액: ${currentBalance.toLocaleString()} P`
                            : "잔액 정보를 불러오지 못했습니다."
                }
            </div>

            {/* 예상 잔액 */}
            <div style={{ fontSize: 18, fontWeight: 800, color: "#008c6e", marginBottom: 16 }}>
                결제 후 예상 잔액: {currentBalance !== null ? (currentBalance - total).toLocaleString() : "?"} P
            </div>

            {/* 버튼 */}
            <div>
                <button
                    onClick={handlePayWithPoints}
                    style={primaryBtn}
                    disabled={isLoading || !!error || currentBalance === null || currentBalance < total}
                >
                    결제하기
                </button>
                <button onClick={close} style={ghostBtn}>취소</button>
            </div>
        </BaseModal>
    );
}
