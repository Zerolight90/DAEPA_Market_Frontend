'use client'

import { useState } from 'react'; // ✅ useState 추가
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { v4 as uuidv4 } from 'uuid';
// ✅ Material UI 컴포넌트 추가
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

export default function ChargeComponent() {
  // ✅ 충전 금액을 관리할 상태 추가
  const [amount, setAmount] = useState('');

  const handleCharge = async () => {
    // ✅ 입력된 금액 유효성 검사
    const chargeAmount = parseInt(amount.replace(/,/g, '')); // 콤마 제거 후 숫자로 변환
    if (isNaN(chargeAmount) || chargeAmount <= 0) {
      alert('올바른 충전 금액을 입력해주세요.');
      return;
    }
    if (chargeAmount > 1000000) { // ✅ 예시: 100만원 충전 제한
      alert('최대 충전 가능 금액은 1,000,000원입니다.');
      return;
    }

    const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);

    tossPayments.requestPayment('카드', {
      // ✅ 상태에서 금액 가져오기
      amount: chargeAmount,
      orderId: `charge-${uuidv4()}`,
      // ✅ 주문명 동적으로 생성
      orderName: `대파 페이 ${chargeAmount.toLocaleString()}원 충전`,
      customerName: '대파', // 실제 유저 이름으로 변경 필요
      successUrl: `http://localhost:8080/api/charge/success`,
      failUrl: `${window.location.origin}/pay/fail`,
    }).catch(error => {
      // ✅ 결제창 호출 실패 또는 사용자 취소 시 에러 처리
      console.error("결제 요청 실패:", error);
      if (error.code !== 'USER_CANCEL') {
        alert(`결제 요청 중 오류가 발생했습니다: ${error.message}`);
      }
    });
  };

  // ✅ 금액 입력 시 숫자 및 콤마 처리
  const handleAmountChange = (event) => {
    const value = event.target.value.replace(/[^0-9]/g, ''); // 숫자 외 입력 제거
    if (value === '') {
      setAmount('');
      return;
    }
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setAmount(numValue.toLocaleString()); // 콤마 추가
    }
  };

  return (
      // ✅ Material UI Box로 감싸고 스타일 추가
      <Box
          sx={{
            margin: '100px auto', // 상하 100px, 좌우 자동 (가운데 정렬)
            padding: '30px',
            maxWidth: '400px', // 최대 너비 지정
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px', // 요소 간 간격
          }}
      >
        <Typography variant="h5" component="h3" gutterBottom>
          대파 페이 충전 💰
        </Typography>

        {/* ✅ Material UI TextField 사용 */}
        <TextField
            label="충전할 금액"
            variant="outlined"
            fullWidth // 너비 100%
            value={amount}
            onChange={handleAmountChange}
            placeholder="금액 입력"
            InputProps={{
              startAdornment: <InputAdornment position="start">₩</InputAdornment>,
              inputMode: 'numeric', // 모바일에서 숫자 키패드 표시
            }}
            helperText="충전할 금액을 숫자로 입력해주세요."
        />

        {/* ✅ Material UI Button 사용 */}
        <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleCharge}
            // ✅ 금액이 입력되지 않으면 버튼 비활성화
            disabled={!amount || parseInt(amount.replace(/,/g, '')) <= 0}
        >
          충전하기
        </Button>
      </Box>
  );
}