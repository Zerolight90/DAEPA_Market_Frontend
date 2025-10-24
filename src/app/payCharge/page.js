'use client'

import { loadTossPayments } from '@tosspayments/payment-sdk';
import { v4 as uuidv4 } from 'uuid'; // 고유 주문번호 생성

export default function ChargeComponent() {
  const handleCharge = async () => {
    const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);

    tossPayments.requestPayment('카드', {
      amount: 20000, // 충전할 금액 (임시이므로 실제 상품 값으로 변경!)
      orderId: `charge-${uuidv4()}`, // "charge-" 로 페이 충전 구문임을 명시
      orderName: '포인트 50,000원 충전', // 페이 충전명
      customerName: '대파', // 실제로는 로그인한 유저 이름으로 변경!
      // 성공 시 백엔드 API로 리다이렉트
      successUrl: `http://localhost:8080/api/pay/success`,
      failUrl: `${window.location.origin}/pay/fail`, // 페이지 만들고 해당 경로로 변경!
    });
  };

  return (
    <div>
      <h3>포인트 충전</h3>
      <button onClick={handleCharge}>20,000원 충전하기</button>
    </div>
  );
}