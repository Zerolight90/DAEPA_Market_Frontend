"use client";

import { useState } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";

import { loadTossPayments } from '@tosspayments/payment-sdk';
import { v4 as uuidv4 } from 'uuid';

export default function BuyModal({ id, close, itemId, title, price }) {
    const [qty, setQty] = useState(1);
    const total = (Number(price) || 0) * qty;

    const pay = async () => {
        // TODO: 결제/주문 API
        // console.log("BUY", { itemId, qty, total });
        // alert("주문이 생성되었습니다. (모의)");
        // close();

        // const handlePay = async () => {
        // ✅ 입력된 금액 유효성 검사
        // const payAmount = parseInt(price.replace(/,/g, '')); // 콤마 제거 후 숫자로 변환
        // if (isNaN(payAmount) || payAmount <= 0) {
        //     alert('올바른 충전 금액을 입력해주세요.');
        //     return;
        // }
        // if (payAmount > 1000000) { // ✅ 예시: 100만원 충전 제한
        //     alert('최대 충전 가능 금액은 1,000,000원입니다.');
        //     return;
        // }

        const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);

        tossPayments.requestPayment('카드', {
            // ✅ 상태에서 금액 가져오기
            amount: total,
            orderId: `product-${itemId}-${uuidv4()}`,
            // ✅ 주문명 동적으로 생성
            orderName: title || '상품 구매',
            customerName: "id", // 실제 유저 이름으로 변경 필요
            successUrl: `http://localhost:8080/api/pay/success`,
            failUrl: `${window.location.origin}/pay/fail`,
        }).catch(error => {
            // ✅ 결제창 호출 실패 또는 사용자 취소 시 에러 처리
            console.error("결제 요청 실패:", error);
            if (error.code !== 'USER_CANCEL') {
                alert(`결제 요청 중 오류가 발생했습니다: ${error.message}`);
            }
        });

    }

    return (
        <BaseModal id={id} close={close} title="안전결제">
            <div style={{ marginBottom: 10, fontWeight: 700 }}>{title}</div>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom: 16 }}>
                <span>수량</span>
                <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e)=>setQty(Math.max(1, Number(e.target.value) || 1))}
                    style={{ width:80, border:"1px solid #ddd", padding:6, borderRadius:6 }}
                />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#008c6e", marginBottom: 16 }}>
                결제금액: {total.toLocaleString()} 원
            </div>
            <div>
                <button onClick={pay} style={primaryBtn}>결제하기</button>
                <button onClick={close} style={ghostBtn}>취소</button>
            </div>
        </BaseModal>
    );
}
const primaryBtn = { background: "#008c6e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer", marginRight: 8 };
const ghostBtn = { background: "#f4f4f4", color: "#333", border: "1px solid #ddd", borderRadius: 8, padding: "10px 14px", cursor: "pointer" };