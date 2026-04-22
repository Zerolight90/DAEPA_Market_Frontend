"use client";

import { useState, useEffect } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";
import { api } from "@/lib/api/client";

export default function PayWithPointModal({ id, close, itemId, title, qty, total, productImageUrl }) {
    const [currentBalance, setCurrentBalance] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 현재 포인트 잔액 조회
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                // api는 axios 인스턴스 → 인터셉터가 토큰 자동 첨부
                const res = await api.get("/pay/balance");
                setCurrentBalance(res.data?.balance ?? res.data ?? 0);
            } catch (err) {
                console.error("잔액 조회 오류:", err);
                setError(err.message);
                setCurrentBalance(0);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBalance();
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
            const errorMessage = err.data?.error || err.message || `포인트 결제 중 오류 발생`;
            alert(`오류: ${errorMessage}`);
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
        cursor: "pointer",
    };

    return (
        <BaseModal id={id} close={close} title="포인트 결제">
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
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom: 16 }}>
                <span>수량: {qty}</span>
            </div>
            <div style={{ marginBottom: 20, fontSize: 14, color: error ? 'red' : '#555', fontWeight: 700 }}>
                결제금액: {total.toLocaleString()} P
            </div>

            <div style={{ marginBottom: 20, fontSize: 14, color: error ? 'red' : '#555', fontWeight: 700 }}>
                {isLoading ? "잔액 조회 중.." :
                    error ? `오류: ${error}` :
                        currentBalance !== null ? `현재 잔액: ${currentBalance.toLocaleString()} P` : "잔액 정보를 불러오지 못했습니다."
                }
            </div>

            <div style={{ fontSize: 18, fontWeight: 800, color: "#008c6e", marginBottom: 16 }}>
                결제 후 예상 잔액: {currentBalance !== null ? (currentBalance - total).toLocaleString() : "?"} P
            </div>

            <div>
                <button
                    onClick={handlePayWithPoints}
                    style={primaryBtn}
                    disabled={isLoading || error || currentBalance === null || currentBalance < total}
                >
                    결제하기
                </button>
                <button onClick={close} style={ghostBtn}>취소</button>
            </div>
        </BaseModal>
    );
}
