"use client";

import { useState } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";

import { useModal } from "@/components/ui/modal/ModalProvider"; // useModal 임포트
import PayWithPointModal from "./PayWithPointModal";

import { loadTossPayments } from '@tosspayments/payment-sdk'; // 결제에 사용할 토스페이먼츠 API 임포트
import { v4 as uuidv4 } from 'uuid'; // orderId 에서 난수값 생성할 uuid 임포트

// 안심 결제가 아닌 일반 결제 진행하는 모달
export default function BuyModal({ id, close, itemId, title, price }) {
    const [qty, setQty] = useState(1); // 물건 양 상태 설정
    const total = (Number(price) || 0) * qty; // 가격과 양을 더해 총 가격 생성
    const modal = useModal(); // modal 훅

    const purchase = async () => {
        // .env 파일에서 토스 클라이언트 키 받아오기
        const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);

        // 결제/주문 토스페이먼츠 API 호출
        tossPayments.requestPayment('카드', {
            // 상태에서 금액 가져오기
            amount: total,
            // 거래번호 필요한 값 붙여서 생성
            orderId: `product-${itemId}-${uuidv4()}`,
            // 주문명 동적 생성
            orderName: title || '상품 구매',
            customerName: "id", // 실제 유저 이름으로 변경 필요
            successUrl: `http://localhost:8080/api/pay/success`,
            failUrl: `${window.location.origin}/pay/fail`,
        }).catch(error => {
            // 결제창 호출 실패 또는 사용자 취소 시 에러 처리
            console.error("결제 요청 실패:", error);
            if (error.code !== 'USER_CANCEL') {
                alert(`결제 요청 중 오류가 발생했습니다: ${error.message}`);
            }
        });

    }

    // 대파 페이 결제 모달 열기
    const openPayWithPointModal = () => {
        // 현재 모달을 닫고 새 모달 열기 (선택 사항)
        // close();

        modal.open(({ id: newModalId, close: newModalClose }) => (
            <PayWithPointModal
                id={newModalId}
                close={newModalClose}
                itemId={itemId}
                title={title}
                qty={qty} // 수량 전달
                total={total} // 총액 전달
            />
        ));
    };

    return ( // 최초 모달 창 내용
        <BaseModal id={id} close={close} title="일반결제">
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
                <button onClick={purchase} style={primaryBtn}>결제하기</button>
                <button onClick={openPayWithPointModal} style={primaryBtn}>페이로 결제하기</button>
                <button onClick={close} style={ghostBtn}>취소</button>
            </div>
        </BaseModal>
    );
}
const primaryBtn = { background: "#008c6e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer", marginRight: 8 };
const ghostBtn = { background: "#f4f4f4", color: "#333", border: "1px solid #ddd", borderRadius: 8, padding: "10px 14px", cursor: "pointer" };