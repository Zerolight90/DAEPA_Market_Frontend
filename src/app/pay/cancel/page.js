'use client'

import tokenStore from "@/app/store/TokenStore";
import {useState} from "react";

// 구매 내역 목록의 개별 아이템 컴포넌트 (가정)
export default function PurchaseItem({ deal }) {
    const { token } = tokenStore();
    const [isCanceling, setIsCanceling] = useState(false);
    const [error, setError] = useState(null);

    // ✅ 테스트 모드: deal이 없으면 가짜 데이터 사용
    deal = { dIdx: 15};

    const handleCancel = async () => {
        if (isCanceling) return;
        if (!confirm("정말 이 거래를 취소하시겠습니까? (결제 즉시 환불)")) {
            return;
        }

        setIsCanceling(true);
        setError(null);
        const currentToken = token || localStorage.getItem('accessToken');

        try {
            const res = await fetch(`http://localhost:8080/api/${deal.dIdx}/payCancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ cancelReason: "고객 변심" }) // 취소 사유 전달
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "취소 요청에 실패했습니다.");
            }

            alert("결제가 성공적으로 취소되었습니다.");
            // TODO: UI를 '취소됨' 상태로 변경 (예: 부모 컴포넌트에 상태 업데이트 요청)
            // onCancelSuccess(deal.dIdx); 

        } catch (err) {
            console.error("취소 오류:", err);
            setError(err.message);
            alert(`오류: ${err.message}`);
        } finally {
            setIsCanceling(false);
        }
    };

    return (
        <div>
            {/* ... (상품명, 가격 등) ... */}
            {(
                <button onClick={handleCancel} disabled={isCanceling}>
                    {isCanceling ? "취소 중..." : "결제 취소"}
                </button>
            )}
            {error && <div style={{color: 'red'}}>{error}</div>}
        </div>
    );
}