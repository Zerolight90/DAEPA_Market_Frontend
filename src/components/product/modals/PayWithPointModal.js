"use client";

import { useState, useEffect } from "react"; // ✅ useEffect 추가
import BaseModal from "@/components/ui/modal/BaseModal";
import tokenStore from "@/app/store/TokenStore"; // ✅ 토큰 스토어 임포트
import { api } from "@/lib/api/client";

export default function PayWithPointModal({ id, close, itemId, title, qty, total }) {
    const [currentBalance, setCurrentBalance] = useState(null); // ✅ 현재 잔액 상태
    const [isLoading, setIsLoading] = useState(true); // ✅ 로딩 상태
    const [error, setError] = useState(null); // ✅ 에러 상태
    const { token } = tokenStore(); // 토큰 가져오기

    // ✅ 컴포넌트 로드 시 현재 페이 잔액 가져오기 (백엔드 API 필요)
    useEffect(() => {
        const fetchBalance = async () => {
            const currentToken = token || localStorage.getItem('accessToken');
            if (!currentToken) {
                setError("로그인이 필요합니다.");
                setIsLoading(false);
                return;
            }

            try {
                // ✅ 백엔드의 페이 잔액 조회 API 호출 (경로 예시)
                const data = await api("/pay/balance", {
                    headers: { 'Authorization': `Bearer ${currentToken}` },
                });
                setCurrentBalance(data.balance);
            } catch (err) {
                console.error("잔액 조회 오류:", err);
                setError(err.message);
                setCurrentBalance(0); // 오류 시 잔액 0으로 처리 (선택)
            } finally {
                setIsLoading(false);
            }
        };
        fetchBalance();
    }, [token]);

    // ✅ '페이로 결제하기' 버튼 클릭 시 실행될 함수
    const handlePayWithPoints = async () => {
        if (isLoading) return; // 로딩 중이면 중복 클릭 방지

        // 1. 잔액 부족 검사
        if (currentBalance === null || currentBalance < total) {
            alert("페이 잔액이 부족합니다. 충전 후 이용해주세요.");
            return;
        }

        // 2. 사용자 확인 (선택 사항)
        if (!confirm(`${total.toLocaleString()} P 를 사용하여 결제하시겠습니까?\n(현재 잔액: ${currentBalance.toLocaleString()} P)`)) {
            return;
        }

        try {
            // 3. ✅ 백엔드 페이 결제 API 호출 (경로 예시)
            const currentToken = token || localStorage.getItem('accessToken');
            const result = await api("/pay/purchase-with-points", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`,
                },
                body: JSON.stringify({
                    itemId: itemId,
                    qty: qty,
                    amount: total, // 검증용 금액 전달
                }),
            });

            // 4. 결제 성공 처리
            alert(`결제가 완료되었습니다.\n남은 잔액: ${result.remainingBalance?.toLocaleString() || '?'} P`);
            close(); // 성공 시 모달 닫기
            // 필요시 구매 완료 페이지로 이동 등 추가 작업
            // router.push('/mypage/buy');

        } catch (err) {
            console.error("페이 결제 오류:", err);
            const errorMessage = err.data?.error || err.message || `페이 결제 중 오류 발생`;
            alert(`오류: ${errorMessage}`);
            // 실패 시 모달을 닫거나 다른 처리
        }
    };


    return (
        <BaseModal id={id} close={close} title="대파 페이로 결제">
            <div style={{ marginBottom: 10, fontWeight: 700 }}>{title}</div>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom: 16 }}>
                <span>수량: {qty}</span> {/* 수량 표시 */}
            </div>
            <div style={{ marginBottom: 20, fontSize: 14, color: error ? 'red' : '#555', fontWeight: 700 }}>
                결제금액: {total.toLocaleString()} P {/* 단위 P로 변경 */}
            </div>

            {/* 잔액 표시 */}
            <div style={{ marginBottom: 20, fontSize: 14, color: error ? 'red' : '#555', fontWeight: 700 }}>
                {isLoading ? "잔액 조회 중..." :
                    error ? `오류: ${error}` :
                        currentBalance !== null ? `현재 잔액: ${currentBalance.toLocaleString()} P` : "잔액 정보를 불러올 수 없습니다."
                }
            </div>

            <div style={{ fontSize: 18, fontWeight: 800, color: "#008c6e", marginBottom: 16 }}>
                결제 후 금액: {currentBalance - total} P
            </div>

            <div>
                {/* ✅ 페이 결제 함수 연결, 잔액 부족 시 비활성화 */}
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

// ✅ 스타일 재사용
const primaryBtn = { background: "#008c6e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer", marginRight: 8 };
const ghostBtn = { background: "#f4f4f4", color: "#333", border: "1px solid #ddd", borderRadius: 8, padding: "10px 14px", cursor: "pointer" };